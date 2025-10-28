import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { getInvoiceQueue } from '@/lib/queue/invoice-queue';
import { createErrorResponse } from '@/lib/utils/api-error-response';

/**
 * POST /api/documentos/enviar
 * Envía un documento electrónico a HKA
 * 
 * Actualizado para usar BullMQ queue:
 * 1. Encola la factura para procesamiento asíncrono
 * 2. El worker se encarga de generar XML, enviar a HKA y actualizar BD
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId es requerido' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, organization: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (invoice.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No tiene acceso a esta factura' }, { status: 403 });
    }

    // Verificar que la factura está en estado DRAFT
    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `No se puede procesar una factura en estado: ${invoice.status}` },
        { status: 400 }
      );
    }

    // Obtener la cola y agregar el trabajo
    const queue = getInvoiceQueue();
    
    const job = await queue.add('process-invoice', {
      invoiceId: invoiceId,
      sendToHKA: invoice.organization.autoSendToHKA ?? true,
      sendEmail: invoice.organization.emailOnCertification ?? true,
    }, {
      jobId: `invoice-${invoiceId}`,
      priority: 5,
    });

    // Actualizar estado a PROCESSING
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: 'PROCESSING',
        hkaLastAttempt: new Date(),
        hkaAttempts: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Factura encolada para procesamiento',
      jobId: job.id,
      status: 'PROCESSING',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error al enviar documento:', error);
    const session = await auth();
    return createErrorResponse(
      error,
      500,
      session?.user?.role,
      session?.user?.id
    );
  }
}
