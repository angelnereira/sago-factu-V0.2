/**
 * API ENDPOINT: Descargar XML de Factura
 * GET /api/invoices/[id]/xml
 * 
 * Retorna el XML generado de una factura para descarga.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
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

    // Obtener factura
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que tiene XML generado
    if (!invoice.xmlContent) {
      return NextResponse.json(
        { error: 'La factura no tiene XML generado' },
        { status: 400 }
      );
    }

    // Generar nombre de archivo
    const fileName = `factura-${invoice.invoiceNumber || invoiceId}.xml`;

    // Retornar XML como descarga
    return new NextResponse(invoice.xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error en /api/invoices/[id]/xml:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

