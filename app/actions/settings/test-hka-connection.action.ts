/**
 * Server Action: Test HKA Connection
 * Prueba conexión y credenciales HKA
 */

'use server';

import { auth } from '@/lib/auth';
import { createHkaService } from '@/lib/hka';
import { logger } from '@/lib/hka/utils/logger';

/**
 * Output: Resultado de test de conexión
 */
export interface TestHkaConnectionOutput {
  success: boolean;
  message: string;
  details?: {
    foliosDisponibles?: number;
    environment?: 'DEMO' | 'PROD';
    responseTime?: number;
  };
  error?: string;
}

/**
 * Prueba conexión con HKA
 */
export async function testHkaConnection(): Promise<TestHkaConnectionOutput> {
  const startTime = Date.now();

  try {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Not authenticated',
        error: 'Unauthorized',
      };
    }

    const userId = session.user.id;

    // 2. Crear servicio HKA
    let hkaService;
    try {
      hkaService = await createHkaService(userId);
    } catch (credentialError: any) {
      logger.error('HKA credentials error during test', {
        userId,
        error: credentialError.message,
      });

      return {
        success: false,
        message: 'Credentials not configured',
        error: 'HKA credentials not configured. Please configure in Settings.',
      };
    }

    // 3. Intentar consultar folios (método más simple para test)
    let foliosResponse;
    try {
      foliosResponse = await hkaService.foliosRestantes();
    } catch (hkaError: any) {
      logger.error('HKA connection test failed', {
        userId,
        error: hkaError.message,
      });

      return {
        success: false,
        message: 'Connection failed',
        error: `HKA error: ${hkaError.message}`,
      };
    }

    // 4. Verificar respuesta
    const responseTime = Date.now() - startTime;

    if (foliosResponse.codigo !== '200') {
      return {
        success: false,
        message: 'Authentication failed',
        error: foliosResponse.mensaje || 'Invalid credentials',
        details: {
          responseTime,
        },
      };
    }

    const foliosDisponibles = parseInt(foliosResponse.foliosDisponibles || '0', 10);

    logger.info('HKA connection test successful', {
      userId,
      foliosDisponibles,
      responseTime,
    });

    return {
      success: true,
      message: 'Connection successful',
      details: {
        foliosDisponibles,
        environment: hkaService.getClient().getEnvironment(),
        responseTime,
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    logger.error('Test HKA connection action failed', {
      error: error.message,
      stack: error.stack,
      responseTime,
    });

    return {
      success: false,
      message: 'Test failed',
      error: 'Internal error. Please try again.',
      details: {
        responseTime,
      },
    };
  }
}

/**
 * Verifica que las credenciales HKA estén configuradas
 */
export async function hasHkaCredentialsConfigured(): Promise<{
  configured: boolean;
  environment?: 'DEMO' | 'PROD';
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { configured: false };
    }

    try {
      const hkaService = await createHkaService(session.user.id);
      return {
        configured: true,
        environment: hkaService.getClient().getEnvironment(),
      };
    } catch (error) {
      return { configured: false };
    }
  } catch (error: any) {
    logger.error('Has HKA credentials check failed', {
      error: error.message,
    });
    return { configured: false };
  }
}
