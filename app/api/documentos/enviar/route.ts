import { NextRequest, NextResponse } from 'next/server';
import { enviarDocumento } from '@/lib/hka/methods/enviar-documento';

/**
 * POST /api/documentos/enviar
 * Envía un documento electrónico a HKA
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { xmlDocumento, invoiceId, xml, factura } = body;
    
    // Modo 1: XML directo
    const xmlToSend = xmlDocumento || xml;
    
    // Modo 2: Factura completa (se generará XML)
    const invoiceData = factura;

    // Validar que haya XML o factura
    if (!xmlToSend && !invoiceData) {
      return NextResponse.json(
        { error: 'Se requiere xml o factura completa' },
        { status: 400 }
      );
    }

    // Si tenemos factura, generar XML (TODO: usar generador XML)
    const finalXml = xmlToSend || '<xml>Generar desde factura</xml>';
    
    // Si no hay invoiceId, generarlo
    const finalInvoiceId = invoiceId || 'temp-' + Date.now();

    const response = await enviarDocumento(finalXml, finalInvoiceId);

    return NextResponse.json({
      success: true,
      message: '✅ Documento enviado exitosamente',
      data: {
        cufe: response.dCufe,
        protocolo: response.dProtocolo,
        qr: response.dQr,
        codigo: response.dCodRes,
        mensaje: response.dMsgRes,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error al enviar documento:', error);
    return NextResponse.json(
      { 
        error: 'Error al enviar documento',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

