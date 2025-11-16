import { NextRequest, NextResponse } from 'next/server';
import { consultarDocumento, obtenerPdfDocumento, obtenerXmlDocumento } from '@/lib/hka/methods/consultar-documento';
import { requireAuth } from '@/lib/auth/api-helpers';
import { prismaServer as prisma } from '@/lib/prisma-server';

/**
 * GET /api/documentos/consultar?cufe=xxx&tipo=json|pdf|xml
 * Consulta un documento electrónico por su CUFE
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const cufe = searchParams.get('cufe');
    const tipo = searchParams.get('tipo') || 'json';
    
    if (!cufe) {
      return NextResponse.json({ error: 'CUFE requerido' }, { status: 400 });
    }

    // Obtener organización del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 });
    }

    const options = { userId: session.user.id };

    switch (tipo) {
      case 'pdf':
        // Obtener PDF
        const pdfBuffer = await obtenerPdfDocumento(cufe, user.organizationId, options);
        return new NextResponse(pdfBuffer as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="documento-${cufe}.pdf"`,
          },
        });

      case 'xml':
        // Obtener XML
        const xml = await obtenerXmlDocumento(cufe, user.organizationId, options);
        return new NextResponse(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="documento-${cufe}.xml"`,
          },
        });

      default:
        // Obtener JSON con toda la información
        const response = await consultarDocumento(cufe, user.organizationId, options);
        return NextResponse.json({
          success: true,
          data: {
            codigo: response.dCodRes,
            mensaje: response.dMsgRes,
            version: response.dVerApl,
            fechaProceso: response.dFecProc,
            xml: response.xContenFE?.rContFe?.xFe,
            hasPdf: !!response.xContenFE?.rContFe?.xContPDF,
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('❌ Error al consultar documento:', error);
    return NextResponse.json(
      { 
        error: 'Error al consultar documento',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

