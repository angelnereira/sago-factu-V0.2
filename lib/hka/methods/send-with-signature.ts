/**
 * Enhanced Enviar Method - Envío de facturas con firma digital automática
 *
 * Integración completa:
 * 1. Validar que el XML de factura exista
 * 2. Verificar si ya está firmado (si no, firmar automáticamente)
 * 3. Validar que la firma sea correcta
 * 4. Enviar a HKA mediante método Enviar
 * 5. Procesar respuesta y guardar en BD
 */

import { HKACredentials } from '../soap/types'
import { signInvoice, isAlreadySigned } from '@/lib/invoices/invoice-signer'
import { hkaClient } from '../soap/client'
import { enviarDocumento } from './enviar-documento'
import { monitorHKACall } from '../monitoring/call-monitor'
import { hkaLogger } from '../utils/logger'
import { prismaServer as prisma } from '@/lib/prisma-server'

/**
 * Opciones para enviar factura con firma automática
 */
export interface SendInvoiceWithSignatureOptions {
  /** ID de la factura en base de datos */
  invoiceId: string
  /** Credenciales HKA para la solicitud */
  credentials: HKACredentials
  /** ID de organización */
  organizationId: string
  /** Certificado digital en base64 */
  certificateBase64: string
  /** Contraseña del certificado */
  certificatePassword: string
  /** Si false, no firmar si ya está sin firmar */
  autoSign?: boolean
  /** Validar RUC antes de firmar */
  validateRuc?: boolean
  /** Intentos de reintento si falla */
  maxRetries?: number
}

/**
 * Resultado del envío con firma
 */
export interface SendWithSignatureResult {
  success: boolean
  invoiceId: string
  cufe?: string
  protocoloAutorizacion?: string
  signed: boolean
  signedAt?: Date
  sentAt?: Date
  error?: string
}

/**
 * Envía una factura a HKA con firma digital automática
 *
 * Flujo completo:
 * 1. Cargar factura de BD
 * 2. Obtener XML
 * 3. Si no está firmada y autoSign=true, firmar automáticamente
 * 4. Validar firma
 * 5. Enviar a HKA
 * 6. Guardar respuesta en BD
 *
 * @param options Opciones de envío con firma
 * @returns Resultado del envío
 * @throws Error si falla en cualquier paso
 */
export async function sendInvoiceWithSignature(
  options: SendInvoiceWithSignatureOptions
): Promise<SendWithSignatureResult> {
  const {
    invoiceId,
    credentials,
    organizationId,
    certificateBase64,
    certificatePassword,
    autoSign = true,
    validateRuc = true,
    maxRetries = 3,
  } = options

  let currentAttempt = 0

  const executeWithRetry = async (): Promise<SendWithSignatureResult> => {
    currentAttempt++

    try {
      hkaLogger.info('[SendWithSignature] Iniciando envío con firma', {
        invoiceId,
        attempt: currentAttempt,
        maxRetries,
      })

      // Paso 1: Cargar factura de BD
      const invoice = await prisma.invoice.findUnique({
        where: {
          id: invoiceId,
          organizationId: organizationId,
        },
        include: {
          organization: {
            select: {
              ruc: true,
              dv: true,
            },
          },
        },
      })

      if (!invoice) {
        throw new Error('Factura no encontrada')
      }

      if (!invoice.xmlContent) {
        throw new Error('Factura sin contenido XML')
      }

      hkaLogger.info('[SendWithSignature] Factura cargada', {
        id: invoice.id,
        status: invoice.status,
      })

      // Paso 2: Verificar y firmar si es necesario
      let xmlToSend = invoice.xmlContent
      let wasSigned = false
      let signedAt: Date | undefined

      if (isAlreadySigned(xmlToSend)) {
        hkaLogger.info('[SendWithSignature] Factura ya está firmada')
      } else if (autoSign) {
        hkaLogger.info('[SendWithSignature] Firmando factura automáticamente')

        try {
          const signResult = await signInvoice({
            xmlFactura: xmlToSend,
            certificateBase64,
            password: certificatePassword,
            ruc: validateRuc ? invoice.organization.ruc || undefined : undefined,
            validateExpiration: true,
          })

          xmlToSend = signResult.signedXml
          wasSigned = true
          signedAt = signResult.signature.timestamp

          hkaLogger.info('[SendWithSignature] Firma aplicada exitosamente', {
            certificateSubject: signResult.signature.certificateSubject,
            daysUntilExpiration: signResult.signature.daysUntilExpiration,
          })

          // Guardar XML firmado en BD
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              xmlContent: xmlToSend,
              status: 'SIGNED',
              signedAt,
            },
          })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          hkaLogger.error('[SendWithSignature] Error al firmar:', { error: errorMsg })
          throw new Error(`Error firmando factura: ${errorMsg}`)
        }
      } else {
        throw new Error('Factura no está firmada y autoSign=false')
      }

      // Paso 3: Enviar a HKA mediante método Enviar
      hkaLogger.info('[SendWithSignature] Enviando a HKA', {
        xml: xmlToSend.substring(0, 100) + '...',
      })

      const sendResult = await monitorHKACall('Enviar', async () => {
        return await enviarDocumento(xmlToSend, invoiceId, organizationId, {
          credentials,
        })
      })

      hkaLogger.info('[SendWithSignature] Respuesta de HKA recibida', {
        codigo: sendResult.dCodRes,
        mensaje: sendResult.dMsgRes,
        cufe: sendResult.dCUFE,
      })

      // Paso 4: Procesar respuesta exitosa
      if (sendResult.dCodRes === '0260') {
        // Factura autorizada
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'AUTHORIZED',
            cufe: sendResult.dCUFE,
            authorizationProtocol: sendResult.dProAut,
            sentAt: new Date(),
          },
        })

        return {
          success: true,
          invoiceId,
          cufe: sendResult.dCUFE,
          protocoloAutorizacion: sendResult.dProAut,
          signed: wasSigned,
          signedAt,
          sentAt: new Date(),
        }
      } else {
        // Respuesta de error de HKA
        throw new Error(
          `HKA error ${sendResult.dCodRes}: ${sendResult.dMsgRes}`
        )
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)

      // Si es error de red/timeout y tenemos reintentos, reintentar
      if (
        currentAttempt < maxRetries &&
        (errorMsg.includes('timeout') ||
          errorMsg.includes('ECONNREFUSED') ||
          errorMsg.includes('ECONNRESET'))
      ) {
        hkaLogger.warn('[SendWithSignature] Error temporal, reintentando', {
          attempt: currentAttempt,
          error: errorMsg,
        })

        // Esperar 2 segundos antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, 2000 * currentAttempt))

        return executeWithRetry()
      }

      // Error fatal o se agotaron reintentos
      hkaLogger.error('[SendWithSignature] Error enviando factura', {
        error: errorMsg,
        attempt: currentAttempt,
      })

      // Guardar error en BD
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'ERROR',
          errorMessage: errorMsg,
        },
      })

      return {
        success: false,
        invoiceId,
        signed: wasSigned,
        signedAt,
        error: errorMsg,
      }
    }
  }

  return executeWithRetry()
}

/**
 * Envía múltiples facturas en lote con firma y manejo de errores
 *
 * @param invoiceIds Array de IDs de facturas
 * @param options Opciones comunes de envío
 * @returns Array con resultados de cada factura
 */
export async function sendInvoicesBatchWithSignature(
  invoiceIds: string[],
  options: Omit<SendInvoiceWithSignatureOptions, 'invoiceId'>
): Promise<SendWithSignatureResult[]> {
  const results: SendWithSignatureResult[] = []

  for (const invoiceId of invoiceIds) {
    try {
      const result = await sendInvoiceWithSignature({
        ...options,
        invoiceId,
      })
      results.push(result)

      hkaLogger.info('[SendWithSignatureBatch] Factura procesada', {
        invoiceId,
        success: result.success,
      })

      // Pequeña pausa entre envíos para no sobrecargar
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      results.push({
        success: false,
        invoiceId,
        signed: false,
        error: errorMsg,
      })

      hkaLogger.error('[SendWithSignatureBatch] Error procesando factura', {
        invoiceId,
        error: errorMsg,
      })
    }
  }

  return results
}

/**
 * Valida que una factura esté lista para enviar
 *
 * @param invoiceId ID de la factura
 * @param organizationId ID de la organización
 * @returns Resultado de validación con mensajes
 */
export async function validateInvoiceReadyToSend(
  invoiceId: string,
  organizationId: string
): Promise<{
  valid: boolean
  messages: string[]
}> {
  const messages: string[] = []

  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        organizationId,
      },
      select: {
        xmlContent: true,
        status: true,
        cufe: true,
      },
    })

    if (!invoice) {
      messages.push('Factura no encontrada')
      return { valid: false, messages }
    }

    if (!invoice.xmlContent) {
      messages.push('Factura sin contenido XML')
    }

    if (!isAlreadySigned(invoice.xmlContent)) {
      messages.push(
        'Factura no está firmada. Será firmada automáticamente al enviar.'
      )
    }

    if (invoice.status === 'AUTHORIZED') {
      messages.push(
        'Factura ya fue autorizada previamente. CUFE: ' + invoice.cufe
      )
    }

    if (invoice.status === 'SENT' || invoice.status === 'AUTHORIZED') {
      return {
        valid: false,
        messages: ['Factura ya fue enviada previamente'],
      }
    }

    return {
      valid: messages.length === 0 || messages.length === 1,
      messages,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      valid: false,
      messages: [errorMsg],
    }
  }
}
