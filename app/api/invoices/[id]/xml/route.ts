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

    // Intentar obtener XML desde BD (preferir XML firmado, luego XML generado)
    let xmlContent: string | null = null;
    let fileName = `factura-${invoice.invoiceNumber || invoiceId}.xml`;
    
    if (invoice.rawXml) {
      // XML firmado por DGI guardado en BD
      console.log('✅ XML firmado encontrado en base de datos');
      xmlContent = invoice.rawXml;
      
      // Decodificar si está en Base64
      if (xmlContent && !xmlContent.startsWith('<?xml')) {
        try {
          xmlContent = Buffer.from(xmlContent, 'base64').toString('utf-8');
        } catch (error) {
          console.error('Error decodificando XML desde Base64:', error);
          xmlContent = invoice.rawXml; // Usar el original si falla
        }
      }
      
      // Marcar como descargado si no estaba marcado
      if (!invoice.xmlDescargado) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { xmlDescargado: true },
        });
      }
    } else if (invoice.xmlContent) {
      // XML generado (no firmado)
      console.log('⚠️ Usando XML generado (no firmado)');
      xmlContent = invoice.xmlContent;
    } else {
      return NextResponse.json({ error: 'La factura no tiene XML disponible' }, { status: 400 });
    }

    // Usar número fiscal si está disponible
    if (invoice.numeroDocumentoFiscal) {
      fileName = `Factura_${invoice.numeroDocumentoFiscal.replace(/\//g, '-')}.xml`;
    }

    // Retornar XML como descarga
    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
