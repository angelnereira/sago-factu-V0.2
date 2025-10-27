import { NextRequest, NextResponse } from 'next/server';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { processInvoiceDirectly } from '@/lib/workers/invoice-processor';
import { requireAuth, requireInvoiceAccess, handleApiError } from '@/lib/auth/api-helpers';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Autenticación
    const session = await requireAuth(request);
    const { id: invoiceId } = await params;

    // Validar acceso a la factura
    await requireInvoiceAccess(invoiceId, session.user.id, session.user.role);

    // Verificar que la factura existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { organization: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar que la factura puede reintentarse
    if (invoice.status !== 'ERROR' && invoice.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Solo se pueden reintentar facturas con error o rechazadas' },
        { status: 400 }
      );
    }

    // Resetear status a DRAFT para reprocesar
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'DRAFT', retryCount: (invoice.retryCount || 0) + 1 },
    });

    // Procesar factura nuevamente
    const result = await processInvoiceDirectly(invoiceId, {
      sendToHKA: invoice.organization.autoSendToHKA ?? true,
      sendEmail: false,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Factura reintentada exitosamente',
        cufe: result.cufe,
        retryCount: (invoice.retryCount || 0) + 1,
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error al reintentar factura', error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
