/**
 * Server Action: Emit Invoice
 * Emite una factura electrónica vía HKA
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createHkaService } from '@/lib/hka';
import { DomainToHkaMapper, HkaToDomainMapper } from '@/lib/hka/mappers';
import { logger } from '@/lib/hka/utils/logger';
import type { EmissionResult } from '@/lib/hka/mappers';

/**
 * Input: ID de la factura a emitir
 */
export interface EmitInvoiceInput {
  invoiceId: string;
}

/**
 * Output: Resultado de emisión
 */
export interface EmitInvoiceOutput {
  success: boolean;
  data?: EmissionResult;
  error?: string;
}

/**
 * Emite una factura electrónica
 */
export async function emitInvoice(input: EmitInvoiceInput): Promise<EmitInvoiceOutput> {
  try {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;

    // 2. Obtener factura con relaciones
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        organization: true,
        customer: true,
        items: true,
      },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // 3. Verificar permisos
    if (invoice.organization.userId !== userId) {
      return { success: false, error: 'Unauthorized - Invoice does not belong to user' };
    }

    // 4. Validar estado
    if (invoice.status === 'EMITTED') {
      return { success: false, error: 'Invoice already emitted' };
    }

    if (invoice.status === 'CANCELLED') {
      return { success: false, error: 'Cannot emit cancelled invoice' };
    }

    // 5. Validar datos para emisión
    try {
      DomainToHkaMapper.validateInvoiceForEmission(invoice as any);
    } catch (validationError: any) {
      logger.error('Invoice validation failed', {
        invoiceId: invoice.id,
        error: validationError.message,
      });
      return { success: false, error: `Validation error: ${validationError.message}` };
    }

    // 6. Crear servicio HKA
    let hkaService;
    try {
      hkaService = await createHkaService(userId);
    } catch (credentialError: any) {
      logger.error('HKA credentials error', {
        userId,
        error: credentialError.message,
      });
      return {
        success: false,
        error: 'HKA credentials not configured. Please configure in Settings.',
      };
    }

    // 7. Mapear a formato HKA
    const enviarRequest = DomainToHkaMapper.toEnviarFacturaRequest(invoice as any);

    logger.info('Emitting invoice via HKA', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
    });

    // 8. Enviar a HKA
    let hkaResponse;
    try {
      hkaResponse = await hkaService.enviar(enviarRequest);
    } catch (hkaError: any) {
      logger.error('HKA emission failed', {
        invoiceId: invoice.id,
        error: hkaError.message,
      });
      return { success: false, error: `HKA error: ${hkaError.message}` };
    }

    // 9. Mapear respuesta
    const emissionResult = HkaToDomainMapper.mapEnviarResponse(hkaResponse);

    if (!emissionResult.success) {
      logger.warn('HKA rejected invoice', {
        invoiceId: invoice.id,
        mensaje: emissionResult.mensaje,
      });
      return {
        success: false,
        error: `HKA rejected: ${emissionResult.mensaje}`,
      };
    }

    // 10. Actualizar factura en BD
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'EMITTED',
        emittedAt: new Date(),
        cufe: emissionResult.cufe,
        protocoloSeguridad: emissionResult.protocoloSeguridad,
        qrCode: emissionResult.qrCode,
        pdfUrl: emissionResult.pdfBase64 ? `data:application/pdf;base64,${emissionResult.pdfBase64}` : null,
        xmlContent: emissionResult.xmlBase64 || null,
      },
    });

    logger.info('Invoice emitted successfully', {
      invoiceId: invoice.id,
      cufe: emissionResult.cufe,
    });

    // 11. Revalidar rutas
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${invoice.id}`);

    return {
      success: true,
      data: emissionResult,
    };
  } catch (error: any) {
    logger.error('Emit invoice action failed', {
      invoiceId: input.invoiceId,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: 'Internal error. Please try again.',
    };
  }
}

/**
 * Emite múltiples facturas en lote
 */
export async function emitInvoicesBatch(
  invoiceIds: string[]
): Promise<{ results: EmitInvoiceOutput[]; summary: { success: number; failed: number } }> {
  const results: EmitInvoiceOutput[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const invoiceId of invoiceIds) {
    const result = await emitInvoice({ invoiceId });
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  return {
    results,
    summary: {
      success: successCount,
      failed: failedCount,
    },
  };
}
