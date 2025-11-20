/**
 * Server Action: Check Folios
 * Consulta balance de folios disponibles en HKA
 */

'use server';

import { auth } from '@/lib/auth';
import { createHkaService } from '@/lib/hka';
import { HkaToDomainMapper } from '@/lib/hka/mappers';
import { logger } from '@/lib/hka/utils/logger';
import type { FolioBalance } from '@/lib/hka/mappers';

/**
 * Output: Balance de folios
 */
export interface CheckFoliosOutput {
  success: boolean;
  data?: FolioBalance;
  error?: string;
}

/**
 * Consulta folios disponibles
 */
export async function checkFolios(): Promise<CheckFoliosOutput> {
  try {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;

    // 2. Crear servicio HKA
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

    // 3. Consultar folios
    let hkaResponse;
    try {
      hkaResponse = await hkaService.foliosRestantes();
    } catch (hkaError: any) {
      logger.error('HKA folios check failed', {
        userId,
        error: hkaError.message,
      });
      return { success: false, error: `HKA error: ${hkaError.message}` };
    }

    // 4. Mapear respuesta
    const folioBalance = HkaToDomainMapper.mapFoliosRestantesResponse(hkaResponse);

    logger.info('Folios checked successfully', {
      userId,
      disponibles: folioBalance.disponibles,
      utilizados: folioBalance.utilizados,
    });

    return {
      success: true,
      data: folioBalance,
    };
  } catch (error: any) {
    logger.error('Check folios action failed', {
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
 * Verifica si hay suficientes folios para emitir
 */
export async function hasSufficientFolios(minRequired: number = 10): Promise<{
  sufficient: boolean;
  available: number;
  warning?: string;
}> {
  const result = await checkFolios();

  if (!result.success || !result.data) {
    return {
      sufficient: false,
      available: 0,
      warning: 'Could not check folio balance',
    };
  }

  const available = result.data.disponibles;
  const sufficient = available >= minRequired;

  return {
    sufficient,
    available,
    warning: !sufficient ? `Only ${available} folios available. Please recharge.` : undefined,
  };
}

/**
 * Obtiene resumen de folios con formato amigable
 */
export async function getFoliosSummary(): Promise<{
  success: boolean;
  summary?: string;
  error?: string;
}> {
  const result = await checkFolios();

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Could not retrieve folios',
    };
  }

  const summary = HkaToDomainMapper.generateFolioSummary(result.data);

  return {
    success: true,
    summary,
  };
}
