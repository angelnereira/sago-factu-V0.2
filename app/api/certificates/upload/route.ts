/**
 * API Endpoint: POST /api/certificates/upload
 *
 * Carga y valida un certificado digital en la base de datos
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaServer as prisma } from '@/lib/prisma-server'
import { getCertificateInfo } from '@/lib/invoices/invoice-signer'
import { certificateToBase64 } from '@/lib/certificates/certificate-manager'
import { hkaLogger } from '@/lib/hka/utils/logger'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Usuario sin organización' },
        { status: 400 }
      )
    }

    const organizationId = user.organizationId

    // Parsear form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const password = formData.get('password') as string
    const name = (formData.get('name') as string) || undefined
    const setAsDefault = formData.get('setAsDefault') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo de certificado requerido' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Contraseña del certificado requerida' },
        { status: 400 }
      )
    }

    const filename = file.name.toLowerCase()
    if (!filename.endsWith('.p12') && !filename.endsWith('.pfx')) {
      return NextResponse.json(
        { error: 'Solo se aceptan archivos .p12 o .pfx' },
        { status: 400 }
      )
    }

    hkaLogger.info('[API/certificates/upload] Procesando carga de certificado', {
      fileName: file.name,
      size: file.size,
      organizationId,
    })

    const tempPath = join(tmpdir(), `cert-${randomUUID()}.p12`)
    const buffer = await file.arrayBuffer()

    try {
      await writeFile(tempPath, Buffer.from(buffer))

      const certInfo = await getCertificateInfo(tempPath, undefined, password)
      const certificateBase64 = await certificateToBase64(tempPath)

      // 🔑 STRATEGY: Delete old certificates and create only the new one
      // This prevents certificate accumulation in the database
      hkaLogger.info('[API/certificates/upload] Eliminando certificados antiguos para evitar acumulación', {
        organizationId,
      })

      // Delete all previous certificates for this organization
      const oldCerts = await prisma.digitalCertificate.findMany({
        where: { organizationId },
        select: { id: true },
      })

      if (oldCerts.length > 0) {
        await prisma.digitalCertificate.deleteMany({
          where: { organizationId },
        })
        hkaLogger.info('[API/certificates/upload] Certificados antiguos eliminados', {
          count: oldCerts.length,
          organizationId,
        })
      }

      // Create new certificate (only one active at a time)
      const digitalCert = await prisma.digitalCertificate.create({
        data: {
          organizationId,
          name: name || `Certificado ${new Date().toLocaleDateString('es-PA')}`,
          certificateData: certificateBase64,
          certificateSubject: certInfo.subject,
          certificateIssuer: certInfo.issuer,
          validFrom: certInfo.validFrom,
          validTo: certInfo.validTo,
          ruc: certInfo.ruc,
          fingerprint: certInfo.fingerprint,
          isActive: true,
          isDefault: true, // Always set as default since it's the only one
        },
      })

      hkaLogger.info('[API/certificates/upload] Certificado cargado exitosamente', {
        certificateId: digitalCert.id,
        subject: certInfo.subject,
        daysUntilExpiration: certInfo.daysUntilExpiration,
      })

      return NextResponse.json({
        success: true,
        certificateId: digitalCert.id,
        certificate: {
          subject: certInfo.subject,
          issuer: certInfo.issuer,
          validFrom: certInfo.validFrom.toISOString(),
          validTo: certInfo.validTo.toISOString(),
          daysUntilExpiration: certInfo.daysUntilExpiration,
          ruc: certInfo.ruc,
          fingerprint: certInfo.fingerprint,
        },
      })
    } finally {
      try {
        await unlink(tempPath)
      } catch (error) {
        hkaLogger.warn('[API/certificates/upload] Error limpiando temp file', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[API/certificates/upload] Error al cargar certificado', {
      error: errorMsg,
    })

    if (errorMsg.includes('password')) {
      return NextResponse.json(
        { error: 'Contraseña del certificado incorrecta' },
        { status: 400 }
      )
    }

    if (errorMsg.includes('PKCS')) {
      return NextResponse.json(
        { error: 'Formato de certificado inválido. Asegúrate de que es .p12 o .pfx' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Error al cargar el certificado',
        details: errorMsg,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Usuario sin organización' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const listAll = searchParams.get('list') === 'true'

    const certs = await prisma.digitalCertificate.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: !listAll,
      },
      select: {
        id: true,
        name: true,
        certificateSubject: true,
        certificateIssuer: true,
        validFrom: true,
        validTo: true,
        ruc: true,
        fingerprint: true,
        isActive: true,
        isDefault: true,
        createdAt: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    const certsWithExpiration = certs.map((cert) => {
      const now = new Date()
      const daysUntilExpiration = Math.floor(
        (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        ...cert,
        daysUntilExpiration,
        isExpired: daysUntilExpiration < 0,
        expiringWarning: daysUntilExpiration < 30 && daysUntilExpiration >= 0,
      }
    })

    return NextResponse.json({
      success: true,
      certificates: certsWithExpiration,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[API/certificates/upload] Error en GET:', { error: errorMsg })

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
