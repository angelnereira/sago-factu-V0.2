/**
 * API ENDPOINT: Procesar Invoice
 * POST /api/invoices/[id]/process
 * 
 * Procesa una factura enviándola al worker para:
 * 1. Generar XML
 * 2. Validar datos
 * 3. Enviar a HKA
 * 4. Actualizar status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { processInvoiceDirectly } from '@/lib/workers/invoice-processor';
import { requireAuth, requireInvoiceAccess } from '@/lib/auth/api-helpers';
import { getPanamaTimestamp } from '@/lib/utils/date-timezone';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Autenticación
    const session = await requireAuth(request);

    const { id: invoiceId } = await params;

    // Verificar que la factura existe
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

    // Validar acceso a la factura
    await requireInvoiceAccess(invoiceId, session.user.id, session.user.role);

    // Verificar que la factura puede procesarse
    if (invoice.status === 'CERTIFIED') {
      return NextResponse.json(
        { error: 'La factura ya está certificada' },
        { status: 400 }
      );
    }

    if (invoice.status === 'PROCESSING') {
      return NextResponse.json(
        { error: 'La factura ya está siendo procesada' },
        { status: 400 }
      );
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'La factura está anulada' },
        { status: 400 }
      );
    }

    // Obtener configuración de la organización
    const autoSendToHKA = invoice.organization.autoSendToHKA ?? true;
    const requireApproval = invoice.organization.requireApproval ?? false;

    // Si requiere aprobación, marcar como QUEUED
    if (requireApproval) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'QUEUED', queuedAt: getPanamaTimestamp() },
      });

      return NextResponse.json({
        success: true,
        message: 'Factura en cola, esperando aprobación',
        status: 'QUEUED',
      });
    }

    // Procesar factura inmediatamente
    // En DEMO: permitir enviar a HKA para probar conexión y credenciales
    // En PROD: solo enviar si hay credenciales configuradas
    const env = (invoice.organization.hkaEnvironment || 'demo').toLowerCase();
    const hasSimpleCreds = Boolean(invoice.organization.hkaTokenUser && invoice.organization.hkaTokenPassword);
    
    // En DEMO siempre intentar enviar si hay credenciales (para testing)
    // En PROD solo enviar si autoSendToHKA está habilitado y hay credenciales
    const shouldSendToHKA = (env === 'demo' || env === 'prod' || env === 'production')
      ? (autoSendToHKA && hasSimpleCreds)
      : false;

    const result = await processInvoiceDirectly(invoiceId, {
      sendToHKA: shouldSendToHKA,
      sendEmail: invoice.organization.emailOnCertification ?? true,
    });

    if (result.success) {
      // Obtener factura actualizada con todos los campos de respuesta HKA
      const invoiceUpdated = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          cufe: true,
          cafe: true,
          numeroDocumentoFiscal: true,
          qrUrl: true,
          qrCode: true,
          hkaProtocol: true,
          hkaProtocolDate: true,
          status: true,
          certifiedAt: true,
        },
      });

      // 🔍 DEBUG: Logging estructurado antes de construir respuesta
      console.group('🚨 [API] Construyendo respuesta exitosa');
      console.log('📊 Invoice Updated:', {
        id: invoiceUpdated?.id,
        status: invoiceUpdated?.status,
        hasCufe: !!invoiceUpdated?.cufe,
        hasCafe: !!invoiceUpdated?.cafe,
        hasQrUrl: !!invoiceUpdated?.qrUrl,
        hasQrCode: !!invoiceUpdated?.qrCode,
        hasNumeroFiscal: !!invoiceUpdated?.numeroDocumentoFiscal,
        hasProtocol: !!invoiceUpdated?.hkaProtocol,
        hasProtocolDate: !!invoiceUpdated?.hkaProtocolDate,
      });
      console.log('📦 Result from worker:', {
        success: result.success,
        sentToHKA: result.sentToHKA,
        cufe: result.cufe,
      });
      console.groupEnd();

      // Construir objeto de respuesta
      const responseData = {
        invoiceId: invoiceUpdated?.id || invoiceId,
        cufe: invoiceUpdated?.cufe || result.cufe || undefined,
        cafe: invoiceUpdated?.cafe || undefined,
        numeroDocumentoFiscal: invoiceUpdated?.numeroDocumentoFiscal || undefined,
        qrUrl: invoiceUpdated?.qrUrl || undefined,
        qrCode: invoiceUpdated?.qrCode || undefined,
        protocoloAutorizacion: invoiceUpdated?.hkaProtocol || undefined,
        fechaRecepcionDGI: invoiceUpdated?.hkaProtocolDate 
          ? invoiceUpdated.hkaProtocolDate.toISOString() 
          : null,
        status: invoiceUpdated?.status || (result.sentToHKA ? 'PROCESSING' : 'CERTIFIED'),
      };

      // 🔍 DEBUG: Validar que responseData tiene campos mínimos
      const hasMinimumData = responseData.invoiceId && (responseData.cufe || responseData.cafe || responseData.status === 'CERTIFIED');
      if (!hasMinimumData) {
        console.warn('⚠️ [API] Response data no tiene campos mínimos:', responseData);
      }

      // 🔍 DEBUG: Logging de respuesta final
      console.group('✅ [API] Respuesta final');
      console.log('📤 Response Data:', responseData);
      console.log('✅ Has Minimum Data:', hasMinimumData);
      console.groupEnd();

      return NextResponse.json({
        success: true,
        message: result.sentToHKA 
          ? 'Factura procesada y enviada a HKA exitosamente' 
          : 'Factura procesada correctamente',
        data: responseData,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error al procesar factura',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Error al procesar factura:', error);
    const message = (error as any)?.message || 'Error al procesar la factura';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

