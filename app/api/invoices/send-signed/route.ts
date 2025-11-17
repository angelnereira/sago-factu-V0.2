/**
 * API Endpoint: POST /api/invoices/send-signed
 *
 * Firma y envía una factura
 * Obtiene automáticamente: certificado del usuario, credenciales de HKA de la organización
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prismaServer as prisma } from '@/lib/prisma-server'
import { signAndSendInvoice } from '@/lib/invoices/simple-sign-and-send'
import { hkaLogger } from '@/lib/hka/utils/logger'

const schema = z.object({
  invoiceId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId } = schema.parse(body)

    hkaLogger.info('[API/send-signed] Solicitud recibida', { invoiceId })

    // Obtener credenciales HKA de la organización del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        organizationId: true,
        organization: {
          select: {
            hkaTokenUser: true,
            hkaTokenPassword: true,
            hkaEnvironment: true,
          },
        },
      },
    })

    if (!user?.organization?.hkaTokenUser || !user?.organization?.hkaTokenPassword) {
      return NextResponse.json(
        { error: 'Credenciales HKA no configuradas' },
        { status: 400 }
      )
    }

    // Firmar y enviar
    const result = await signAndSendInvoice({
      invoiceId,
      userId: session.user.id,
      hkaUsername: user.organization.hkaTokenUser,
      hkaPassword: user.organization.hkaTokenPassword,
      hkaEnvironment: user.organization.hkaEnvironment || 'demo',
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    hkaLogger.info('[API/send-signed] Éxito', {
      invoiceId,
      cufe: result.cufe,
    })

    return NextResponse.json({
      success: true,
      invoiceId: result.invoiceId,
      cufe: result.cufe,
      protocol: result.protocol,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    hkaLogger.error('[API/send-signed] Error', { error: msg })

    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}
