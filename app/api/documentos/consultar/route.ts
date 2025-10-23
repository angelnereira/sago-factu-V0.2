import { NextRequest, NextResponse } from 'next/server';
import { consultarDocumento, obtenerPdfDocumento, obtenerXmlDocumento } from '@/lib/hka/methods/consultar-documento';

/**
 * GET /api/documentos/consultar?cufe=xxx&tipo=json|pdf|xml
 * Consulta un documento electrónico por su CUFE
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cufe = searchParams.get('cufe');
    const tipo = searchParams.get('tipo') || 'json';
    
    if (!cufe) {
      return NextResponse.json({ error: 'CUFE requerido' }, { status: 400 });
    }

    switch (tipo) {
      case 'pdf':
        // Obtener PDF
        const pdfBuffer = await obtenerPdfDocumento(cufe);
        return new NextResponse(pdfBuffer as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="documento-${cufe}.pdf"`,
          },
        });

      case 'xml':
        // Obtener XML
        const xml = await obtenerXmlDocumento(cufe);
        return new NextResponse(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="documento-${cufe}.xml"`,
          },
        });

      default:
        // Obtener JSON con toda la información
        const response = await consultarDocumento(cufe);
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

