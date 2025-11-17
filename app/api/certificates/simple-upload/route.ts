/**
 * API Endpoint: POST /api/certificates/simple-upload
 *
 * Carga UN SOLO certificado (sobreescribe anterior)
 * Configuración mínima y simplificada
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaServer as prisma } from '@/lib/prisma-server'
import { getCertificateInfo } from '@/lib/invoices/invoice-signer'
import { hkaLogger } from '@/lib/hka/utils/logger'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const password = formData.get('password') as string

    if (!file || !password) {
      return NextResponse.json(
        { error: 'Archivo y contraseña requeridos' },
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

    hkaLogger.info('[API/cert-upload] Cargando certificado', { fileName: file.name })

    const tempPath = join(tmpdir(), `cert-${randomUUID()}.p12`)
    const buffer = await file.arrayBuffer()

    try {
      await writeFile(tempPath, Buffer.from(buffer))
      const certInfo = await getCertificateInfo(tempPath, undefined, password)

      // Leer archivo como Buffer para almacenar
      const certBuffer = Buffer.from(buffer)

      // Eliminar certificados anteriores del usuario
      await prisma.digitalCertificate.deleteMany({
        where: { userId: session.user.id },
      })

      // Crear nuevo certificado (solo uno)
      const cert = await prisma.digitalCertificate.create({
        data: {
          userId: session.user.id,
          organizationId: user.organizationId,
          certificateP12: certBuffer,
          certificatePem: certInfo.subject,
          ruc: certInfo.ruc || '',
          issuer: certInfo.issuer,
          subject: certInfo.subject,
          serialNumber: randomUUID(),
          validFrom: certInfo.validFrom,
          validTo: certInfo.validTo,
          isActive: true,
          uploadedBy: session.user.id,
        },
      })

      // Actualizar o crear UserSignatureConfig
      await prisma.userSignatureConfig.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          organizationId: user.organizationId,
          digitalCertificateId: cert.id,
          autoSign: true,
          signatureMode: 'PERSONAL',
        },
        update: {
          digitalCertificateId: cert.id,
        },
      })

      hkaLogger.info('[API/cert-upload] Certificado guardado', {
        subject: certInfo.subject,
        validTo: certInfo.validTo,
        daysUntilExpiration: certInfo.daysUntilExpiration,
      })

      return NextResponse.json({
        success: true,
        certificate: {
          subject: certInfo.subject,
          issuer: certInfo.issuer,
          validTo: certInfo.validTo.toISOString(),
          daysUntilExpiration: certInfo.daysUntilExpiration,
          ruc: certInfo.ruc,
        },
      })
    } finally {
      try {
        await unlink(tempPath)
      } catch (error) {
        // Ignorar error al limpiar
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[API/cert-upload] Error', { error: errorMsg })

    if (errorMsg.includes('password')) {
      return NextResponse.json(
        { error: 'Contraseña del certificado incorrecta' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al cargar el certificado' },
      { status: 500 }
    )
  }
}

/**
 * GET - Obtener información del certificado actual del usuario
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const config = await prisma.userSignatureConfig.findUnique({
      where: { userId: session.user.id },
      include: {
        digitalCertificate: {
          select: {
            subject: true,
            issuer: true,
            validFrom: true,
            validTo: true,
            ruc: true,
          },
        },
      },
    })

    if (!config?.digitalCertificate) {
      return NextResponse.json({ certificate: null })
    }

    const now = new Date()
    const daysUntilExpiration = Math.floor(
      (config.digitalCertificate.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      certificate: {
        ...config.digitalCertificate,
        validFrom: config.digitalCertificate.validFrom.toISOString(),
        validTo: config.digitalCertificate.validTo.toISOString(),
        daysUntilExpiration,
        isExpired: daysUntilExpiration < 0,
      },
    })
  } catch (error) {
    hkaLogger.error('[API/cert-upload] Error en GET', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Error al obtener certificado' }, { status: 500 })
  }
}
