import { NextRequest, NextResponse } from 'next/server';
import { anularDocumento } from '@/lib/hka/methods/anular-documento';

/**
 * POST /api/documentos/anular
 * Anula un documento electrónico
 */
export async function POST(request: NextRequest) {
  try {
    const { cufe, motivo, invoiceId } = await request.json();

    if (!cufe || !motivo || !invoiceId) {
      return NextResponse.json(
        { error: 'cufe, motivo e invoiceId son requeridos' },
        { status: 400 }
      );
    }

    const response = await anularDocumento(cufe, motivo, invoiceId);

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

