/**
 * API Endpoint: POST /api/certificates/[id]/default
 *
 * Establece un certificado como default para la organización
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaServer as prisma } from '@/lib/prisma-server'
import { hkaLogger } from '@/lib/hka/utils/logger'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar que el certificado existe y pertenece a la organización
    const cert = await prisma.digitalCertificate.findUnique({
      where: { id: params.id },
      select: { organizationId: true, isActive: true },
    })

    if (!cert) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      )
    }

    if (cert.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este certificado' },
        { status: 403 }
      )
    }

    if (!cert.isActive) {
      return NextResponse.json(
        { error: 'No puedes usar un certificado inactivo' },
        { status: 400 }
      )
    }

    // Desactivar otros certificados como default
    await prisma.digitalCertificate.updateMany({
      where: {
        organizationId: user.organizationId,
        id: { not: params.id },
      },
      data: { isDefault: false },
    })

    // Establecer este como default
    await prisma.digitalCertificate.update({
      where: { id: params.id },
      data: { isDefault: true },
    })

    hkaLogger.info('[API/certificates/default] Certificado establecido como default', {
      certificateId: params.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[API/certificates/default] Error:', { error: errorMsg })

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
