/**
 * API ENDPOINT: Anular Factura Certificada
 * POST /api/invoices/[id]/cancel
 * 
 * Anula una factura certificada en HKA.
 * Solo disponible para facturas certificadas hace menos de 7 días.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { anularDocumento } from '@/lib/hka/methods/anular-documento';

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

    // Obtener datos del body (motivo de anulación)
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const motivo = body.motivo || 'Anulación solicitada por usuario';

    // Verificar que la factura existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la factura está certificada
    if (invoice.status !== 'CERTIFIED') {
      return NextResponse.json(
        { error: 'Solo se pueden anular facturas certificadas' },
        { status: 400 }
      );
    }

    // Verificar que tiene CUFE
    if (!invoice.cufe) {
      return NextResponse.json(
        { error: 'La factura no tiene CUFE' },
        { status: 400 }
      );
    }

    // Verificar límite de 7 días
    if (!invoice.certifiedAt) {
      return NextResponse.json(
        { error: 'Fecha de certificación no encontrada' },
        { status: 400 }
      );
    }

    const daysSinceCertification = Math.floor(
      (new Date().getTime() - new Date(invoice.certifiedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCertification > 7) {
      return NextResponse.json(
        { 
          error: 'Solo se pueden anular facturas certificadas hace menos de 7 días',
          daysSinceCertification,
        },
        { status: 400 }
      );
    }

    // Anular en HKA
    const result = await anularDocumento(invoice.cufe, motivo, invoiceId);

    if (result.dCodRes === '0200') {
      // Actualizar factura en BD
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'CANCELLED',
          isCancelled: true,
          cancelledAt: new Date(),
          cancellationReason: motivo,
          cancellationCufe: result.dProtocoloAnulacion || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Factura anulada exitosamente',
        protocolo: result.dProtocoloAnulacion,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'HKA rechazó la anulación',
        hkaCode: result.dCodRes,
        hkaMessage: result.dMsgRes,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en /api/invoices/[id]/cancel:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

