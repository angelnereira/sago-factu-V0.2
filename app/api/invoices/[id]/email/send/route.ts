import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { enviarCorreoHKA } from '@/lib/hka/methods/enviar-correo';

/**
 * POST /api/invoices/[id]/email/send
 * Envía la factura por correo electrónico usando el método EnvioCorreo de HKA
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: invoiceId } = await params;

    // Obtener factura con organización
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        organization: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso a esta factura
    if (invoice.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta factura' },
        { status: 403 }
      );
    }

    // Validar que la factura está certificada
    if (invoice.status !== 'CERTIFIED') {
      return NextResponse.json(
        { error: 'Solo se pueden enviar facturas certificadas por correo' },
        { status: 400 }
      );
    }

    // Validar que tiene CUFE
    if (!invoice.cufe) {
      return NextResponse.json(
        { error: 'La factura no tiene CUFE. Debe estar certificada por HKA primero.' },
        { status: 400 }
      );
    }

    // Parsear body
    const body = await request.json();
    const { recipientEmail, includePDF = true, includeXML = true, customMessage } = body;

    // Validar email
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'El correo del destinatario es requerido' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'El formato del correo electrónico es inválido' },
        { status: 400 }
      );
    }

    // Enviar correo a HKA
    const hkaResponse = await enviarCorreoHKA({
      CAFE: invoice.cufe,
      CorreoDestinatario: recipientEmail,
      IncluirPDF: includePDF,
      IncluirXML: includeXML,
      MensajePersonalizado: customMessage,
    });

    // Crear registro de envío en base de datos
    const emailDelivery = await prisma.emailDelivery.create({
      data: {
        invoiceId: invoice.id,
        recipientEmail: recipientEmail,
        hkaTrackingId: hkaResponse.IdRastreo,
        status: 'SENT',
        sentAt: new Date(hkaResponse.FechaEnvio),
        includePDF: includePDF,
        includeXML: includeXML,
        customMessage: customMessage || null,
      },
    });

    // Agregar log a InvoiceLog
    await prisma.invoiceLog.create({
      data: {
        invoiceId: invoice.id,
        action: 'EMAIL_SENT',
        message: `Factura enviada por correo electrónico a ${recipientEmail}`,
        userId: session.user.id,
        userEmail: session.user.email || null,
        metadata: {
          trackingId: hkaResponse.IdRastreo,
          recipientEmail: recipientEmail,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Factura enviada exitosamente a ${recipientEmail}`,
      data: {
        trackingId: hkaResponse.IdRastreo,
        sentAt: hkaResponse.FechaEnvio,
        emailDeliveryId: emailDelivery.id,
      },
    });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al enviar correo electrónico',
      },
      { status: 500 }
    );
  }
}
