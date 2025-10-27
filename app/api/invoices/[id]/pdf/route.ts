import { NextRequest, NextResponse } from 'next/server';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { obtenerPdfDocumento } from '@/lib/hka/methods/consultar-documento';
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

    // Verificar que la factura está certificada
    if (invoice.status !== 'CERTIFIED') {
      return NextResponse.json(
        { error的习惯: 'La factura no está certificada. Solo las facturas certificadas tienen PDF disponible.' },
        { status: 400 }
      );
    }

    // Verificar que tiene CUFE
    if (!invoice.cufe) {
      return NextResponse.json({ error: 'La factura no tiene CUFE' }, { status: 400 });
    }

    // Obtener PDF desde HKA
    const pdfBuffer = await obtenerPdfDocumento(invoice.cufe);

    if (!pdfBuffer) {
      return NextResponse.json({ error: 'No se pudo obtener el PDF desde HKA' }, { status: 500 });
    }

    // Generar nombre de archivo
    const fileName = `factura-${invoice.invoiceNumber || invoiceId}.pdf`;

    // Retornar PDF como descarga
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
