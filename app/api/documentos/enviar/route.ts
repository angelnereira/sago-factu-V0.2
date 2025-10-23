import { NextRequest, NextResponse } from 'next/server';
import { enviarDocumento } from '@/lib/hka/methods/enviar-documento';

/**
 * POST /api/documentos/enviar
 * Envía un documento electrónico a HKA
 */
export async function POST(request: NextRequest) {
  try {
    const { xmlDocumento, invoiceId } = await request.json();

    if (!xmlDocumento || !invoiceId) {
      return NextResponse.json(
        { error: 'xmlDocumento e invoiceId son requeridos' },
        { status: 400 }
      );
    }

    const response = await enviarDocumento(xmlDocumento, invoiceId);

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

