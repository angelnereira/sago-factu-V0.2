/**
 * API ENDPOINT: Procesar Invoice
 * POST /api/invoices/[id]/process
 * 
 * Procesa una factura enviándola al worker para:
 * 1. Generar XML
 * 2. Validar datos
 * 3. Enviar a HKA
 * 4. Actualizar status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { processInvoiceDirectly } from '@/lib/workers/invoice-processor';
import { requireAuth, requireInvoiceAccess } from '@/lib/auth/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Autenticación
    const session = await requireAuth(request);

    const { id: invoiceId } = await params;

    // Verificar que la factura existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        organization: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Validar acceso a la factura
    await requireInvoiceAccess(invoiceId, session.user.id, session.user.role);

    // Verificar que la factura puede procesarse
    if (invoice.status === 'CERTIFIED') {
      return NextResponse.json(
        { error: 'La factura ya está certificada' },
        { status: 400 }
      );
    }

    if (invoice.status === 'PROCESSING') {
      return NextResponse.json(
        { error: 'La factura ya está siendo procesada' },
        { status: 400 }
      );
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'La factura está anulada' },
        { status: 400 }
      );
    }

    // Obtener configuración de la organización
    const autoSendToHKA = invoice.organization.autoSendToHKA ?? true;
    const requireApproval = invoice.organization.requireApproval ?? false;

    // Si requiere aprobación, marcar como QUEUED
    if (requireApproval) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'QUEUED', queuedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: 'Factura en cola, esperando aprobación',
        status: 'QUEUED',
      });
    }

    // Procesar factura inmediatamente
    const env = (invoice.organization.hkaEnvironment || 'demo').toLowerCase();
    const hasSimpleCreds = Boolean(invoice.organization.hkaTokenUser && invoice.organization.hkaTokenPassword);
    const shouldSendToHKA = autoSendToHKA && (
      env === 'prod' || env === 'production' ? true : hasSimpleCreds
    );

    const result = await processInvoiceDirectly(invoiceId, {
      sendToHKA: shouldSendToHKA,
      sendEmail: invoice.organization.emailOnCertification ?? true,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.sentToHKA 
          ? 'Factura procesada y enviada a HKA' 
          : 'Factura procesada (XML generado)',
        cufe: result.cufe,
        status: result.sentToHKA ? 'PROCESSING' : 'DRAFT',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error al procesar factura',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Error al procesar factura:', error);
    const message = (error as any)?.message || 'Error al procesar la factura';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

