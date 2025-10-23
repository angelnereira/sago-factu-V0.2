/**
 * API ENDPOINT: Reintentar Procesamiento de Invoice
 * POST /api/invoices/[id]/retry
 * 
 * Reintenta el procesamiento de una factura que falló o fue rechazada.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processInvoiceDirectly } from '@/lib/workers/invoice-processor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Agregar autenticación con NextAuth v5
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    // }

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
      data: { 
        status: 'DRAFT',
        retryCount: (invoice.retryCount || 0) + 1,
      },
    });

    // Procesar factura nuevamente
    const result = await processInvoiceDirectly(invoiceId, {
      sendToHKA: invoice.organization.autoSendToHKA ?? true,
      sendEmail: false, // No enviar email en reintentos
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Factura reintentada exitosamente',
        cufe: result.cufe,
        retryCount: (invoice.retryCount || 0) + 1,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error al reintentar factura',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error en /api/invoices/[id]/retry:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

