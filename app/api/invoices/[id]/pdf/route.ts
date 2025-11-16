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
        { error: 'La factura no está certificada. Solo las facturas certificadas tienen PDF disponible.' },
        { status: 400 }
      );
    }

    // Intentar obtener PDF desde BD primero (guarda la respuesta de HKA)
    let pdfBuffer: Buffer | null = null;
    let fileName = `factura-${invoice.invoiceNumber || invoiceId}.pdf`;
    
    if (invoice.pdfBase64) {
      // PDF guardado en BD desde la respuesta de HKA
      console.log('✅ PDF encontrado en base de datos');
      pdfBuffer = Buffer.from(invoice.pdfBase64, 'base64');
      
      // Usar número fiscal si está disponible
      if (invoice.numeroDocumentoFiscal) {
        fileName = `Factura_${invoice.numeroDocumentoFiscal.replace(/\//g, '-')}.pdf`;
      }
      
      // Marcar como descargado si no estaba marcado
      if (!invoice.pdfDescargado) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { pdfDescargado: true },
        });
      }
    } else if (invoice.cufe) {
      // Fallback: obtener PDF desde HKA si no está en BD
      console.log('⚠️ PDF no en BD, obteniendo desde HKA...');
      try {
        pdfBuffer = await obtenerPdfDocumento(invoice.cufe, invoice.organizationId, { userId: invoice.createdBy });
        if (!pdfBuffer) {
          return NextResponse.json({ error: 'No se pudo obtener el PDF desde HKA' }, { status: 500 });
        }
        
        // Guardar PDF en BD para futuras consultas y marcar como descargado
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            pdfBase64: pdfBuffer.toString('base64'),
            pdfDescargado: true,
          },
        });
      } catch (error) {
        console.error('Error al obtener PDF desde HKA:', error);
        return NextResponse.json({ error: 'PDF no disponible en la base de datos ni en HKA' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'La factura no tiene PDF disponible' }, { status: 404 });
    }

    // Generar nombre de archivo
    const finalFileName = fileName;

    // Retornar PDF como descarga
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${finalFileName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
