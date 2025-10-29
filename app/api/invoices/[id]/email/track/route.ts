import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { rastrearCorreoHKA, mapHKAToEmailStatus } from '@/lib/hka/methods/rastrear-correo';

/**
 * POST /api/invoices/[id]/email/track
 * Actualiza el estado de tracking de un correo electrónico
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: invoiceId } = await params;

    // Parsear body
    const body = await request.json();
    const { hkaTrackingId } = body;

    if (!hkaTrackingId) {
      return NextResponse.json(
        { error: 'El tracking ID es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el emailDelivery existe y pertenece a la factura
    const emailDelivery = await prisma.emailDelivery.findFirst({
      where: {
        invoiceId: invoiceId,
        hkaTrackingId: hkaTrackingId,
      },
      include: {
        invoice: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!emailDelivery) {
      return NextResponse.json(
        { error: 'Correo no encontrado para esta factura' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso a esta factura
    if (emailDelivery.invoice.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta factura' },
        { status: 403 }
      );
    }

    // Rastrear correo en HKA
    const hkaResponse = await rastrearCorreoHKA(hkaTrackingId);

    // Mapear estado de HKA a EmailStatus
    const newStatus = mapHKAToEmailStatus(hkaResponse.Estado);

    // Actualizar registro de correo
    const updateData: any = {
      status: newStatus,
    };

    if (hkaResponse.FechaEnvio) {
      updateData.sentAt = new Date(hkaResponse.FechaEnvio);
    }

    if (hkaResponse.FechaEntrega && newStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date(hkaResponse.FechaEntrega);
    }

    if (newStatus === 'BOUNCED' || newStatus === 'FAILED') {
      updateData.lastError = hkaResponse.dMsgRes || 'Error de entrega';
      updateData.retryCount = emailDelivery.retryCount + 1;
    }

    const updatedEmailDelivery = await prisma.emailDelivery.update({
      where: { id: emailDelivery.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Estado del correo actualizado: ${newStatus}`,
      data: {
        status: updatedEmailDelivery.status,
        sentAt: updatedEmailDelivery.sentAt,
        deliveredAt: updatedEmailDelivery.deliveredAt,
      },
    });
  } catch (error) {
    console.error('Error al rastrear correo:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al rastrear correo electrónico',
      },
      { status: 500 }
    );
  }
}
