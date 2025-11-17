/**
 * API Endpoint: POST /api/invoices/sign
 *
 * Firma digitalmente una factura electrónica antes de enviarla a HKA
 *
 * Request body:
 * {
 *   invoiceId: string (ID de factura en BD - opcional si xmlFactura provided)
 *   xmlFactura: string (XML sin firmar - opcional si invoiceId provided)
 *   certificateBase64?: string (certificado en base64 - si está en secretos)
 *   password: string (contraseña del certificado)
 *   validateRuc?: boolean (validar que RUC del cert coincida)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   signedXml: string (XML firmado listo para HKA)
 *   signature: {
 *     algorithm: string
 *     timestamp: ISO string
 *     certificateSubject: string
 *     daysUntilExpiration: number
 *   }
 *   validations: {
 *     certificateValid: boolean
 *     signatureValid: boolean
 *     rucMatch: boolean
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prismaServer as prisma } from '@/lib/prisma-server'
import { signInvoice, isAlreadySigned, getCertificateInfo } from '@/lib/invoices/invoice-signer'
import { hkaLogger } from '@/lib/hka/utils/logger'

// Validación de request
const signInvoiceRequestSchema = z.object({
  invoiceId: z.string().optional(),
  xmlFactura: z.string().optional(),
  certificateBase64: z.string().optional(),
  certificateId: z.string().optional(),
  password: z.string().min(1, 'Password requerida'),
  validateRuc: z.boolean().default(true),
  validateExpiration: z.boolean().default(true),
})

type SignInvoiceRequest = z.infer<typeof signInvoiceRequestSchema>

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Parsear y validar request
    const body = await request.json()
    let data: SignInvoiceRequest

    try {
      data = signInvoiceRequestSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    hkaLogger.info('[API/sign] Solicitud de firma recibida', {
      invoiceId: data.invoiceId,
      hasCertificateBase64: !!data.certificateBase64,
      hasCertificateId: !!data.certificateId,
    })

    // Obtener usuario con organización
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Usuario sin organización asociada' },
        { status: 400 }
      )
    }

    let xmlFactura = data.xmlFactura
    let invoiceData: any = {}

    // Si se proporciona invoiceId, cargar XML desde BD
    if (data.invoiceId && !xmlFactura) {
      hkaLogger.info('[API/sign] Cargando factura desde BD', {
        invoiceId: data.invoiceId,
      })

      invoiceData = await prisma.invoice.findUnique({
        where: {
          id: data.invoiceId,
          organizationId: user.organizationId,
        },
        select: {
          id: true,
          xmlContent: true,
          issuerRuc: true,
          issuerDv: true,
          status: true,
        },
      })

      if (!invoiceData) {
        return NextResponse.json(
          { error: 'Factura no encontrada' },
          { status: 404 }
        )
      }

      xmlFactura = invoiceData.xmlContent

      if (!xmlFactura) {
        return NextResponse.json(
          { error: 'Factura sin contenido XML' },
          { status: 400 }
        )
      }
    }

    if (!xmlFactura) {
      return NextResponse.json(
        { error: 'Se requiere xmlFactura o invoiceId' },
        { status: 400 }
      )
    }

    // Verificar si ya está firmada
    if (isAlreadySigned(xmlFactura)) {
      return NextResponse.json(
        { error: 'La factura ya está firmada' },
        { status: 400 }
      )
    }

    // Cargar certificado
    let certificateBase64 = data.certificateBase64

    if (data.certificateId && !certificateBase64) {
      hkaLogger.info('[API/sign] Cargando certificado desde BD', {
        certificateId: data.certificateId,
      })

      const digitalCert = await prisma.digitalCertificate.findUnique({
        where: {
          id: data.certificateId,
          organizationId: user.organizationId,
        },
        select: {
          certificateData: true,
          isActive: true,
        },
      })

      if (!digitalCert || !digitalCert.isActive) {
        return NextResponse.json(
          { error: 'Certificado no encontrado o inactivo' },
          { status: 404 }
        )
      }

      // El certificateData debería estar encriptado en la BD
      // Se desencripta automáticamente por prisma-field-encryption
      certificateBase64 = digitalCert.certificateData
    }

    if (!certificateBase64 && !process.env.HKA_CERTIFICATE_BASE64) {
      return NextResponse.json(
        { error: 'Certificado no disponible. Configúralo en Configuración → Firma Digital' },
        { status: 400 }
      )
    }

    // Usar certificado de variables de entorno como fallback
    if (!certificateBase64) {
      certificateBase64 = process.env.HKA_CERTIFICATE_BASE64
    }

    // Firmar factura
    hkaLogger.info('[API/sign] Iniciando proceso de firma')

    const result = await signInvoice({
      xmlFactura,
      certificateBase64,
      password: data.password,
      ruc: data.validateRuc ? invoiceData.issuerRuc : undefined,
      validateExpiration: data.validateExpiration,
    })

    // Si tiene invoiceId, actualizar en BD con XML firmado
    if (data.invoiceId) {
      hkaLogger.info('[API/sign] Actualizando factura con XML firmado', {
        invoiceId: data.invoiceId,
      })

      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          xmlContent: result.signedXml,
          status: 'SIGNED',
          signedAt: result.signature.timestamp,
        },
      })
    }

    hkaLogger.info('[API/sign] Firma completada exitosamente')

    return NextResponse.json({
      success: true,
      signedXml: result.signedXml,
      signature: {
        algorithm: result.signature.algorithm,
        timestamp: result.signature.timestamp.toISOString(),
        certificateSubject: result.signature.certificateSubject,
        daysUntilExpiration: result.signature.daysUntilExpiration,
      },
      validations: result.validations,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[API/sign] Error al firmar:', { error: errorMsg })

    return NextResponse.json(
      {
        error: 'Error al firmar la factura',
        details: errorMsg,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/invoices/sign?certificateId=...
 *
 * Obtiene información de un certificado sin firmar
 * Útil para UI: mostrar info del cert antes de firmar
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('certificateId')
    const password = searchParams.get('password')

    if (!certificateId || !password) {
      return NextResponse.json(
        { error: 'Se requieren certificateId y password' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Usuario sin organización' },
        { status: 400 }
      )
    }

    const digitalCert = await prisma.digitalCertificate.findUnique({
      where: {
        id: certificateId,
        organizationId: user.organizationId,
      },
      select: {
        certificateData: true,
        isActive: true,
      },
    })

    if (!digitalCert || !digitalCert.isActive) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      )
    }

    const certInfo = await getCertificateInfo(
      undefined,
      digitalCert.certificateData,
      password
    )

    return NextResponse.json({
      success: true,
      certificate: certInfo,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[API/sign] Error en GET:', { error: errorMsg })

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
