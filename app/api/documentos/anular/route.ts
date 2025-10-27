import { NextRequest, NextResponse } from 'next/server';
import { anularDocumento } from '@/lib/hka/methods/anular-documento';

/**
 * POST /api/documentos/anular
 * Anula un documento electrónico
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cufe, motivo, invoiceId, documentId, environment } = body;
    
    // Acceptar cufe o documentId
    const cufeFinal = cufe || documentId;
    
    if (!cufeFinal || !motivo) {
      return NextResponse.json(
        { error: 'cufe (o documentId) y motivo son requeridos' },
        { status: 400 }
      );
    }
    
    // invoiceId opcional, environment opcional
    const invoiceIdFinal = invoiceId || 'temp-' + Date.now();
    const env = environment || 'demo';

    const response = await anularDocumento(cufeFinal, motivo, invoiceIdFinal);

    return NextResponse.json({
      success: true,
      message: '✅ Documento anulado exitosamente',
      data: {
        protocoloAnulacion: response.dProtocoloAnulacion,
        codigo: response.dCodRes,
        mensaje: response.dMsgRes,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error al anular documento:', error);
    return NextResponse.json(
      { 
        error: 'Error al anular documento',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
