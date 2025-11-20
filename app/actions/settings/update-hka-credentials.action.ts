/**
 * Server Action: Update HKA Credentials
 * Actualiza o crea credenciales HKA del usuario
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { logger } from '@/lib/hka/utils/logger';

/**
 * Input: Credenciales HKA
 */
export interface UpdateHkaCredentialsInput {
  tokenUser: string;
  tokenPassword: string;
  environment: 'DEMO' | 'PROD';
}

/**
 * Output: Resultado de actualización
 */
export interface UpdateHkaCredentialsOutput {
  success: boolean;
  error?: string;
}

/**
 * Actualiza credenciales HKA del usuario
 */
export async function updateHkaCredentials(
  input: UpdateHkaCredentialsInput
): Promise<UpdateHkaCredentialsOutput> {
  try {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;

    // 2. Validar input
    if (!input.tokenUser || input.tokenUser.trim().length === 0) {
      return { success: false, error: 'Token User is required' };
    }

    if (!input.tokenPassword || input.tokenPassword.trim().length === 0) {
      return { success: false, error: 'Token Password is required' };
    }

    if (!['DEMO', 'PROD'].includes(input.environment)) {
      return { success: false, error: 'Invalid environment. Must be DEMO or PROD' };
    }

    // 3. Encriptar password
    let encryptedPassword: string;
    try {
      encryptedPassword = await encrypt(input.tokenPassword);
    } catch (encryptError: any) {
      logger.error('Failed to encrypt HKA password', {
        userId,
        error: encryptError.message,
      });
      return { success: false, error: 'Failed to encrypt password' };
    }

    // 4. Buscar credencial existente
    const existingCredential = await prisma.hKACredential.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (existingCredential) {
      // Actualizar existente
      await prisma.hKACredential.update({
        where: { id: existingCredential.id },
        data: {
          tokenUser: input.tokenUser,
          tokenPassword: encryptedPassword,
          environment: input.environment,
          updatedAt: new Date(),
        },
      });

      logger.info('HKA credentials updated', {
        userId,
        environment: input.environment,
      });
    } else {
      // Crear nueva
      await prisma.hKACredential.create({
        data: {
          userId,
          tokenUser: input.tokenUser,
          tokenPassword: encryptedPassword,
          environment: input.environment,
          isActive: true,
        },
      });

      logger.info('HKA credentials created', {
        userId,
        environment: input.environment,
      });
    }

    // 5. Revalidar settings page
    revalidatePath('/settings');

    return { success: true };
  } catch (error: any) {
    logger.error('Update HKA credentials action failed', {
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
 * Obtiene credenciales HKA actuales (sin password)
 */
export async function getHkaCredentials(): Promise<{
  success: boolean;
  data?: {
    tokenUser: string;
    environment: 'DEMO' | 'PROD';
    hasPassword: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const credential = await prisma.hKACredential.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        tokenUser: true,
        tokenPassword: true,
        environment: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!credential) {
      return {
        success: false,
        error: 'No HKA credentials configured',
      };
    }

    return {
      success: true,
      data: {
        tokenUser: credential.tokenUser,
        environment: credential.environment as 'DEMO' | 'PROD',
        hasPassword: Boolean(credential.tokenPassword),
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      },
    };
  } catch (error: any) {
    logger.error('Get HKA credentials action failed', {
      error: error.message,
    });

    return {
      success: false,
      error: 'Internal error. Please try again.',
    };
  }
}

/**
 * Elimina credenciales HKA
 */
export async function deleteHkaCredentials(): Promise<UpdateHkaCredentialsOutput> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Marcar como inactivo en lugar de eliminar (soft delete)
    await prisma.hKACredential.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    logger.info('HKA credentials deleted', { userId });

    revalidatePath('/settings');

    return { success: true };
  } catch (error: any) {
    logger.error('Delete HKA credentials action failed', {
      error: error.message,
    });

    return {
      success: false,
      error: 'Internal error. Please try again.',
    };
  }
}
