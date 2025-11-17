/**
 * Simple Sign and Send
 *
 * Versión simplificada: obtiene automáticamente el certificado del usuario
 * No requiere pasar credenciales - usa las configuradas en la organización
 */

import { signInvoice, isAlreadySigned } from '@/lib/invoices/invoice-signer'
import { enviarDocumento } from '@/lib/hka/methods/enviar-documento'
import { hkaLogger } from '@/lib/hka/utils/logger'
import { prismaServer as prisma } from '@/lib/prisma-server'

export interface SimpleSignAndSendOptions {
  /** ID de la factura */
  invoiceId: string
  /** ID del usuario que firma */
  userId: string
  /** Credenciales HKA de la organización */
  hkaUsername: string
  hkaPassword: string
  hkaEnvironment?: string
}

export interface SignAndSendResult {
  success: boolean
  invoiceId: string
  cufe?: string
  protocol?: string
  error?: string
}

/**
 * Obtiene el certificado del usuario desde BD
 */
async function getUserCertificate(userId: string) {
  const config = await prisma.userSignatureConfig.findUnique({
    where: { userId },
    include: {
      digitalCertificate: {
        select: {
          certificateP12: true,
          validTo: true,
          subject: true,
        },
      },
      user: {
        select: {
          organizationId: true,
          organization: {
            select: {
              ruc: true,
            },
          },
        },
      },
    },
  })

  if (!config?.digitalCertificate) {
    throw new Error('No hay certificado configurado para este usuario')
  }

  const daysLeft = Math.floor(
    (config.digitalCertificate.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  if (daysLeft < 0) {
    throw new Error(`Certificado vencido hace ${Math.abs(daysLeft)} días`)
  }

  return {
    certificateBuffer: config.digitalCertificate.certificateP12,
    ruc: config.user?.organization?.ruc,
    subject: config.digitalCertificate.subject,
    daysLeft,
  }
}

/**
 * Firma y envía una factura usando el certificado del usuario
 * Obtiene automáticamente credenciales y certificado
 */
export async function signAndSendInvoice(
  options: SimpleSignAndSendOptions
): Promise<SignAndSendResult> {
  try {
    hkaLogger.info('[SignAndSend] Iniciando', { invoiceId: options.invoiceId })

    // 1. Cargar factura
    const invoice = await prisma.invoice.findUnique({
      where: { id: options.invoiceId },
      select: {
        xmlContent: true,
        status: true,
      },
    })

    if (!invoice?.xmlContent) {
      return {
        success: false,
        invoiceId: options.invoiceId,
        error: 'Factura no encontrada o sin XML',
      }
    }

    // 2. Obtener certificado del usuario
    let cert
    try {
      cert = await getUserCertificate(options.userId)
    } catch (error) {
      return {
        success: false,
        invoiceId: options.invoiceId,
        error: error instanceof Error ? error.message : 'Error obteniendo certificado',
      }
    }

    // 3. Firmar si no está firmada
    let xmlToSign = invoice.xmlContent
    let wasSigned = false

    if (!isAlreadySigned(xmlToSign)) {
      try {
        hkaLogger.info('[SignAndSend] Firmando factura')

        // Convertir Buffer a base64 para signInvoice
        const certBase64 = cert.certificateBuffer.toString('base64')

        const signResult = await signInvoice({
          xmlFactura: xmlToSign,
          certificateBase64: certBase64,
          password: '', // Sin contraseña - ya está en el Buffer
          ruc: cert.ruc,
          validateExpiration: true,
        })

        xmlToSign = signResult.signedXml
        wasSigned = true

        hkaLogger.info('[SignAndSend] Factura firmada exitosamente')
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error en firma'
        hkaLogger.error('[SignAndSend] Error al firmar', { error: msg })
        return {
          success: false,
          invoiceId: options.invoiceId,
          error: `Error al firmar: ${msg}`,
        }
      }
    }

    // 4. Enviar a HKA
    try {
      hkaLogger.info('[SignAndSend] Enviando a HKA')

      const sendResult = await enviarDocumento(xmlToSign, options.invoiceId, '', {
        credentials: {
          username: options.hkaUsername,
          password: options.hkaPassword,
        },
      })

      // 5. Procesar respuesta
      if (sendResult.dCodRes === '0260') {
        // Éxito
        hkaLogger.info('[SignAndSend] Factura autorizada', { cufe: sendResult.dCUFE })

        return {
          success: true,
          invoiceId: options.invoiceId,
          cufe: sendResult.dCUFE,
          protocol: sendResult.dProAut,
        }
      } else {
        // Error de HKA
        hkaLogger.warn('[SignAndSend] Error de HKA', {
          code: sendResult.dCodRes,
          message: sendResult.dMsgRes,
        })

        return {
          success: false,
          invoiceId: options.invoiceId,
          error: `HKA ${sendResult.dCodRes}: ${sendResult.dMsgRes}`,
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      hkaLogger.error('[SignAndSend] Error enviando a HKA', { error: msg })
      return {
        success: false,
        invoiceId: options.invoiceId,
        error: msg,
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    hkaLogger.error('[SignAndSend] Error general', { error: msg })
    return {
      success: false,
      invoiceId: options.invoiceId,
      error: msg,
    }
  }
}
