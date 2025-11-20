/**
 * Server Action: Cancel Invoice
 * Anula una factura electrónica previamente emitida
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createHkaService } from '@/lib/hka';
import { HkaToDomainMapper } from '@/lib/hka/mappers';
import { logger } from '@/lib/hka/utils/logger';
import type { CancellationResult } from '@/lib/hka/mappers';

/**
 * Input: ID de la factura y motivo de anulación
 */
export interface CancelInvoiceInput {
  invoiceId: string;
  motivo: string;
}

/**
 * Output: Resultado de anulación
 */
export interface CancelInvoiceOutput {
  success: boolean;
  data?: CancellationResult;
  error?: string;
}

/**
 * Anula una factura electrónica
 */
export async function cancelInvoice(input: CancelInvoiceInput): Promise<CancelInvoiceOutput> {
  try {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;

    // 2. Validar motivo
    if (!input.motivo || input.motivo.trim().length < 10) {
      return {
        success: false,
        error: 'Motivo de anulación debe tener al menos 10 caracteres',
      };
    }

    // 3. Obtener factura
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        organization: true,
      },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // 4. Verificar permisos
    if (invoice.organization.userId !== userId) {
      return { success: false, error: 'Unauthorized - Invoice does not belong to user' };
    }

    // 5. Validar estado
    if (invoice.status !== 'EMITTED') {
      return {
        success: false,
        error: 'Only emitted invoices can be cancelled',
      };
    }

    if (!invoice.cufe) {
      return {
        success: false,
        error: 'Invoice does not have CUFE - cannot cancel',
      };
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

    logger.info('Cancelling invoice via HKA', {
      invoiceId: invoice.id,
      cufe: invoice.cufe,
      motivo: input.motivo,
    });

    // 7. Anular en HKA
    let hkaResponse;
    try {
      hkaResponse = await hkaService.anulacionDocumento({
        codigoGeneracion: invoice.cufe,
        motivoAnulacion: input.motivo,
      });
    } catch (hkaError: any) {
      logger.error('HKA cancellation failed', {
        invoiceId: invoice.id,
        cufe: invoice.cufe,
        error: hkaError.message,
      });
      return { success: false, error: `HKA error: ${hkaError.message}` };
    }

    // 8. Mapear respuesta
    const cancellationResult = HkaToDomainMapper.mapAnulacionResponse(hkaResponse);

    if (!cancellationResult.success) {
      logger.warn('HKA rejected cancellation', {
        invoiceId: invoice.id,
        cufe: invoice.cufe,
        mensaje: cancellationResult.mensaje,
      });
      return {
        success: false,
        error: `HKA rejected: ${cancellationResult.mensaje}`,
      };
    }

    // 9. Actualizar factura en BD
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: input.motivo,
      },
    });

    logger.info('Invoice cancelled successfully', {
      invoiceId: invoice.id,
      cufe: invoice.cufe,
    });

    // 10. Revalidar rutas
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${invoice.id}`);

    return {
      success: true,
      data: cancellationResult,
    };
  } catch (error: any) {
    logger.error('Cancel invoice action failed', {
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
 * Verifica si una factura puede ser anulada
 */
export async function canCancelInvoice(invoiceId: string): Promise<{
  canCancel: boolean;
  reason?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { canCancel: false, reason: 'Not authenticated' };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        organization: true,
      },
    });

    if (!invoice) {
      return { canCancel: false, reason: 'Invoice not found' };
    }

    if (invoice.organization.userId !== session.user.id) {
      return { canCancel: false, reason: 'Unauthorized' };
    }

    if (invoice.status !== 'EMITTED') {
      return { canCancel: false, reason: 'Invoice not emitted' };
    }

    if (!invoice.cufe) {
      return { canCancel: false, reason: 'Invoice does not have CUFE' };
    }

    // Validar tiempo: HKA permite anular hasta 30 días después de emisión
    if (invoice.emittedAt) {
      const daysSinceEmission = Math.floor(
        (Date.now() - invoice.emittedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceEmission > 30) {
        return {
          canCancel: false,
          reason: 'Cannot cancel invoices older than 30 days',
        };
      }
    }

    return { canCancel: true };
  } catch (error: any) {
    logger.error('Can cancel invoice check failed', {
      invoiceId,
      error: error.message,
    });

    return { canCancel: false, reason: 'Error checking cancellation eligibility' };
  }
}
