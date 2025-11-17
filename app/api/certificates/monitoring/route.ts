/**
 * API Endpoint: GET /api/certificates/monitoring
 *
 * Proporciona estadísticas y monitoreo de certificados digitales
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaServer as prisma } from '@/lib/prisma-server'
import { hkaLogger } from '@/lib/hka/utils/logger'

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

    // Obtener todos los certificados de la organización
    const certs = await prisma.digitalCertificate.findMany({
      where: {
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        name: true,
        validTo: true,
        isActive: true,
        isDefault: true,
        createdAt: true,
      },
    })

    const now = new Date()

    // Calcular métricas
    let totalActive = 0
    let totalExpiring = 0
    let totalExpired = 0
    let sumDaysToExpiration = 0

    const certificatesWithStatus = certs.map((cert) => {
      const daysUntilExpiration = Math.floor(
        (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      const isExpired = daysUntilExpiration < 0
      const expiringWarning = daysUntilExpiration < 30 && daysUntilExpiration >= 0

      if (isExpired) {
        totalExpired++
      } else if (expiringWarning) {
        totalExpiring++
      }

      if (cert.isActive && !isExpired) {
        totalActive++
      }

      sumDaysToExpiration += Math.max(0, daysUntilExpiration)

      return {
        id: cert.id,
        name: cert.name,
        daysUntilExpiration: Math.max(0, daysUntilExpiration),
        isExpired,
        expiringWarning,
      }
    })

    const averageDaysToExpiration =
      certs.length > 0 ? Math.round(sumDaysToExpiration / certs.length) : 0

    hkaLogger.info('[API/certificates/monitoring] Monitoreo generado', {
      total: certs.length,
      active: totalActive,
      expiring: totalExpiring,
      expired: totalExpired,
    })

    return NextResponse.json({
      success: true,
      status: {
        total: certs.length,
        active: totalActive,
        expiring: totalExpiring,
        expired: totalExpired,
        averageDaysToExpiration,
      },
      certificates: certificatesWithStatus,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[API/certificates/monitoring] Error:', { error: errorMsg })

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
