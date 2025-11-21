/**
 * Server Action: Test HKA Connection
 * Prueba conexión y credenciales HKA
 */

'use server';

import { auth } from '@/lib/auth';
import { createHkaService } from '@/lib/hka';
import { hkaLogger } from '@/lib/hka/utils/logger';

/**
 * Output: Resultado de test de conexión
 */
export interface TestHkaConnectionOutput {
  success: boolean;
  message: string;
  details?: {
    // Información de licencia
    licencia?: string;
    fechaLicencia?: string;

    // Información de ciclo
    ciclo?: string;
    fechaCiclo?: string;

    // Folios del ciclo actual
    foliosTotalesCiclo?: number;
    foliosUtilizadosCiclo?: number;
    foliosDisponibleCiclo?: number;

    // Folios totales (históricos)
    foliosTotales?: number;
    foliosTotalesDisponibles?: number;

    // Metadatos de la prueba
    environment?: 'DEMO' | 'PROD';
    responseTime?: number;
    codigoRespuesta?: string;
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
      await hkaLogger.error('TEST_CONNECTION', 'HKA credentials error during test', {
        data: { userId },
        error: credentialError,
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
      await hkaLogger.error('TEST_CONNECTION', 'HKA connection test failed', {
        data: { userId },
        error: hkaError,
      });

      return {
        success: false,
        message: 'Connection failed',
        error: `HKA error: ${hkaError.message}`,
      };
    }

    // 4. Verificar respuesta
    const responseTime = Date.now() - startTime;

    // HKA retorna código '200' para éxito
    if (foliosResponse.codigo !== '200') {
      return {
        success: false,
        message: 'HKA returned non-success code',
        error: foliosResponse.mensaje || 'Invalid credentials or HKA error',
        details: {
          codigoRespuesta: foliosResponse.codigo,
          responseTime,
        },
      };
    }

    // Extraer datos con fallback entre nombres nuevos y legacy
    const foliosTotalesDisponibles =
      foliosResponse.foliosTotalesDisponibles ??
      foliosResponse.foliosDisponibles ??
      0;

    await hkaLogger.info('TEST_CONNECTION', 'HKA connection test successful', {
      data: {
        userId,
        foliosTotalesDisponibles,
        responseTime,
        licencia: foliosResponse.licencia,
      }
    });

    return {
      success: true,
      message: 'Connection successful',
      details: {
        // Información de licencia
        licencia: foliosResponse.licencia,
        fechaLicencia: foliosResponse.fechaLicencia,

        // Información de ciclo
        ciclo: foliosResponse.ciclo,
        fechaCiclo: foliosResponse.fechaCiclo,

        // Folios del ciclo actual
        foliosTotalesCiclo: foliosResponse.foliosTotalesCiclo,
        foliosUtilizadosCiclo: foliosResponse.foliosUtilizadosCiclo,
        foliosDisponibleCiclo: foliosResponse.foliosDisponibleCiclo,

        // Folios totales (históricos)
        foliosTotales: foliosResponse.foliosTotales,
        foliosTotalesDisponibles,

        // Metadatos
        environment: hkaService.getClient().getEnvironment(),
        responseTime,
        codigoRespuesta: foliosResponse.codigo,
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    await hkaLogger.error('TEST_CONNECTION', 'Test HKA connection action failed', {
      error: error,
      data: { responseTime }
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
    await hkaLogger.error('CHECK_CREDENTIALS', 'Has HKA credentials check failed', {
      error: error,
    });
    return { configured: false };
  }
}
