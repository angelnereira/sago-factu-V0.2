import { NextRequest, NextResponse } from 'next/server';
import { anularDocumento } from '@/lib/hka/methods/anular-documento';
import { requireAuth } from '@/lib/auth/api-helpers';
import { prismaServer as prisma } from '@/lib/prisma-server';

/**
 * POST /api/documentos/anular
 * Anula un documento electrónico
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { cufe, motivo, invoiceId, documentId } = body;
    
    // Acceptar cufe o documentId
    const cufeFinal = cufe || documentId;
    
    if (!cufeFinal || !motivo) {
      return NextResponse.json(
        { error: 'cufe (o documentId) y motivo son requeridos' },
        { status: 400 }
      );
    }
    
    // Obtener organización del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 });
    }
    
    // invoiceId opcional
    const invoiceIdFinal = invoiceId || 'temp-' + Date.now();

    const response = await anularDocumento(
      cufeFinal,
      motivo,
      invoiceIdFinal,
      user.organizationId,
      { userId: session.user.id }
    );

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
