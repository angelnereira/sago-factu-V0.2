import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { enviarDocumento } from '@/lib/hka/methods/enviar-documento';
import { generateXMLFromInvoice } from '@/lib/hka/transformers/invoice-to-xml';

/**
 * POST /api/documentos/enviar
 * Envía un documento electrónico a HKA
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId es requerido' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, organization: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (invoice.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No tiene acceso a esta factura' }, { status: 403 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: invoice.receiverRuc || '' },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { xml, cufe, errores } = await generateXMLFromInvoice({ ...invoice, customer } as any, customer);

    if (errores.length > 0) {
      return NextResponse.json({ error: 'Errores en la factura', details: errores }, { status: 400 });
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { xmlContent: xml, cufe },
    });

    const response = await enviarDocumento(xml, invoiceId);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: response.success ? 'CERTIFIED' : 'REJECTED',
        hkaProtocol: response.dProtocolo,
        hkaProtocolDate: new Date(),
        hkaResponseCode: response.dCodRes,
        hkaResponseMessage: response.dMsgRes,
        hkaCode: response.dCodRes,
        pdfBase64: response.xContPDF,
        qrCode: response.dQr,
        certifiedAt: response.success ? new Date() : null,
        hkaResponseData: {
          dCufe: response.dCufe,
          dProtocolo: response.dProtocolo,
          dQr: response.dQr,
          dCodRes: response.dCodRes,
          dMsgRes: response.dMsgRes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: response.success ? 'Documento certificado exitosamente' : 'Documento rechazado',
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
    console.error('Error al enviar documento:', error);
    return NextResponse.json(
      { error: 'Error al enviar documento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
