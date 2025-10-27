import { NextRequest, NextResponse } from 'next/server';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { requireAuth, requireInvoiceAccess, handleApiError } from '@/lib/auth/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Autenticación
    const session = await requireAuth(request);
    const { id: invoiceId } = await params;

    // Validar acceso a la factura
    await requireInvoiceAccess(invoiceId, session.user.id, session.user.role);

    // Obtener factura
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar que tiene XML generado
    if (!invoice.xmlContent) {
      return NextResponse.json({ error: 'La factura no tiene XML generado' }, { status: 400 });
    }

    // Generar nombre de archivo
    const fileName = `factura-${invoice.invoiceNumber || invoiceId}.xml`;

    // Retornar XML como descarga
    return new NextResponse(invoice.xml忙, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
