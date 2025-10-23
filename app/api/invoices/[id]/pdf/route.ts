/**
 * API ENDPOINT: Descargar PDF de Factura Certificada
 * GET /api/invoices/[id]/pdf
 * 
 * Retorna el PDF certificado de HKA para descarga.
 * Si el PDF no está en caché, lo consulta desde HKA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { obtenerPdfDocumento } from '@/lib/hka/methods/consultar-documento';

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

    // Verificar que la factura está certificada
    if (invoice.status !== 'CERTIFIED') {
      return NextResponse.json(
        { error: 'La factura no está certificada. Solo las facturas certificadas tienen PDF disponible.' },
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

    // TODO: Verificar si hay PDF en caché/S3
    // if (invoice.pdfUrl) {
    //   // Redirigir al PDF en S3
    //   return NextResponse.redirect(invoice.pdfUrl);
    // }

    // Obtener PDF desde HKA
    const pdfBuffer = await obtenerPdfDocumento(invoice.cufe);

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'No se pudo obtener el PDF desde HKA' },
        { status: 500 }
      );
    }

    // TODO: Guardar PDF en S3 para caché futuro
    // await uploadToS3(pdfBuffer, `invoices/${invoiceId}.pdf`);
    // await prisma.invoice.update({
    //   where: { id: invoiceId },
    //   data: { pdfUrl: s3Url },
    // });

    // Generar nombre de archivo
    const fileName = `factura-${invoice.invoiceNumber || invoiceId}.pdf`;

    // Retornar PDF como descarga
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000', // 1 año de caché
      },
    });
  } catch (error) {
    console.error('Error en /api/invoices/[id]/pdf:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

