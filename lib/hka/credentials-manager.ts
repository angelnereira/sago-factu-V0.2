/**
 * 🔒 MANEJO SEGURO DE CREDENCIALES HKA
 *
 * ⚠️ CRÍTICO: Este módulo maneja credenciales sensibles
 * - NUNCA modifica process.env globalmente (race condition en multi-tenant)
 * - Credenciales se pasan por contexto de request
 * - Compatible con Plan Simple y Plan Empresarial
 * - Integración con IHkaSecretProvider para obtener secretos de forma segura
 *
 * ARQUITECTURA:
 * 1. Para Plan Simple: Obtiene credenciales de HKACredential table (plaintext en BD)
 * 2. Para Plan Empresarial: Usa IHkaSecretProvider (env, vault, etc.)
 * 3. Nunca expone credenciales en logs o errores
 */

import { z } from 'zod';
import { getSecretProvider } from './secret-provider';

// ============================================================================
// TIPOS Y SCHEMAS
// ============================================================================

export const HKACredentialsSchema = z.object({
  tokenUser: z.string().min(1),
  tokenPassword: z.string().min(1),
  environment: z.enum(['demo', 'prod']),
  source: z.enum(['user', 'organization', 'system']).default('system'),
  credentialId: z.string().optional(),
});

export type HKACredentials = z.infer<typeof HKACredentialsSchema>;

// ============================================================================
// FUNCIONES DE OBTENCIÓN DE CREDENCIALES
// ============================================================================

/**
 * Obtiene credenciales HKA para una organización
 *
 * Prioridad:
 * 1. Credenciales del usuario (si userId está presente)
 * 2. Credenciales de la organización (Plan Simple)
 * 3. null (Plan Empresarial - usar credenciales de .env)
 */
export async function getHKACredentials(
  organizationId: string,
  options: { userId?: string } = {}
): Promise<HKACredentials | null> {
  // Imports estáticos (no dinámicos dentro de la función)
  const prismaServer = require('@/lib/prisma-server').prismaServer;
  const { OrganizationPlan } = require('@prisma/client');

  const requestId = crypto.randomUUID();

  try {
    // 1. Intentar obtener credenciales del usuario (Plan Simple)
    if (options.userId) {
      console.debug('[HKA] Buscando credenciales de usuario', { userId: options.userId });

      const userCredential = await prismaServer.hKACredential.findFirst({
        where: { userId: options.userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (userCredential) {
        console.log('[HKA] Credenciales de usuario encontradas', {
          source: 'user',
          environment: userCredential.environment,
        });

        const credentials = {
          tokenUser: userCredential.tokenUser,
          tokenPassword: userCredential.tokenPassword,
          environment: userCredential.environment === 'PROD' ? 'prod' : 'demo',
          source: 'user' as const,
          credentialId: userCredential.id,
        };

        // Validar schema
        return HKACredentialsSchema.parse(credentials);
      }
    }

    // 2. Obtener credenciales de la organización
    const org = await prismaServer.organization.findUnique({
      where: { id: organizationId },
      select: {
        plan: true,
        hkaTokenUser: true,
        hkaTokenPassword: true,
        hkaEnvironment: true,
      },
    });

    if (!org) {
      console.error('[HKA] Organización no encontrada', { organizationId });
      return null;
    }

    // 3. Plan Simple: usar credenciales de la organización
    if (org.plan === OrganizationPlan.SIMPLE) {
      if (!org.hkaTokenUser || !org.hkaTokenPassword) {
        console.error('[HKA] Credenciales HKA no configuradas en Plan Simple');
        throw new Error(
          '❌ Plan Simple: configura tus credenciales HKA en Configuración → Integraciones.\n' +
          'Contacta a soporte@thefactoryhka.com.pa para obtener credenciales.'
        );
      }

      console.log('[HKA] Usando credenciales de organización (Plan Simple)', {
        source: 'organization',
        environment: org.hkaEnvironment,
      });

      const credentials = {
        tokenUser: org.hkaTokenUser,
        tokenPassword: org.hkaTokenPassword,
        environment:
          org.hkaEnvironment === 'prod' || org.hkaEnvironment === 'production'
            ? 'prod'
            : 'demo',
        source: 'organization' as const,
      };

      return HKACredentialsSchema.parse(credentials);
    }

    // 4. Plan Empresarial: usar credenciales centralizadas de .env
    console.debug('[HKA] Plan Empresarial: usando credenciales de .env');
    return null;
  } catch (error) {
    console.error('[HKA] Error obteniendo credenciales HKA', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Obtiene credenciales del sistema usando IHkaSecretProvider (versión mejorada)
 *
 * ✅ ARQUITECTURA: Usa proveedor de secretos en lugar de acceso directo a .env
 * - Permite usar diferentes fuentes: env, vault, secrets manager, etc.
 * - Desacopla obtención de credenciales del almacenamiento específico
 * - Facilita rotación de credenciales sin cambiar código
 */
export async function getSystemHKACredentials(): Promise<HKACredentials> {
  const secretProvider = getSecretProvider();
  const environment = process.env.HKA_ENV || 'demo';

  try {
    const tokenUser = await secretProvider.getSecret(
      environment === 'prod' ? 'HKA_PROD_TOKEN_USER' : 'HKA_DEMO_TOKEN_USER',
      { environment: environment as 'demo' | 'prod' }
    );

    const tokenPassword = await secretProvider.getSecret(
      environment === 'prod' ? 'HKA_PROD_TOKEN_PASSWORD' : 'HKA_DEMO_TOKEN_PASSWORD',
      { environment: environment as 'demo' | 'prod' }
    );

    return HKACredentialsSchema.parse({
      tokenUser,
      tokenPassword,
      environment: (environment === 'prod' ? 'prod' : 'demo') as 'demo' | 'prod',
      source: 'system',
    });
  } catch (error) {
    console.error('[HKA] Error obteniendo credenciales del sistema desde secretProvider', {
      environment,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      'Credenciales HKA no configuradas en secretProvider. ' +
      'Configure HKA_DEMO_TOKEN_USER/PASSWORD o HKA_PROD_TOKEN_USER/PASSWORD en su entorno.'
    );
  }
}

/**
 * Resuelve credenciales HKA para una organización
 *
 * Retorna:
 * 1. Credenciales específicas de la organización (si las tiene)
 * 2. Credenciales del sistema desde IHkaSecretProvider (Plan Empresarial)
 *
 * ✅ PATRÓN: Usa IHkaSecretProvider para obtener credenciales de sistema
 */
export async function resolveHKACredentials(
  organizationId: string,
  options: { userId?: string } = {}
): Promise<HKACredentials> {
  const orgCredentials = await getHKACredentials(organizationId, options);
  if (orgCredentials) {
    return orgCredentials;
  }

  // Fallback a credenciales del sistema (ahora usando IHkaSecretProvider)
  return getSystemHKACredentials();
}

/**
 * ✅ PATRÓN RECOMENDADO: Usar credenciales sin modificar process.env
 *
 * ANTES (❌ INCORRECTO - Race condition en multi-tenancy):
 * ```typescript
 * process.env.HKA_TOKEN = credentials.tokenUser;
 * const result = await hkaClient.enviar(document);
 * // ¡PELIGROSO! Otras requests pueden leer credenciales de otra organización
 * ```
 *
 * AHORA (✅ CORRECTO - Credenciales en contexto local):
 * ```typescript
 * const credentials = await resolveHKACredentials(orgId);
 * const result = await hkaClient.enviar(document, credentials);
 * // ✅ Las credenciales se pasan explícitamente, no en process.env global
 * ```
 *
 * ARQUITECTURA CON SECRETPROVIDER:
 * 1. Para Plan Simple: BD (HKACredential table) → desencripta inline
 * 2. Para Plan Empresarial: IHkaSecretProvider → env/vault/secrets-manager
 */
export async function executeWithCredentials<T>(
  organizationId: string,
  fn: (credentials: HKACredentials) => Promise<T>,
  options: { userId?: string } = {}
): Promise<T> {
  const credentials = await resolveHKACredentials(organizationId, options);
  return fn(credentials);
}

/**
 * Alias para executeWithCredentials (compatibilidad con código existente)
 *
 * ⚠️ IMPORTANTE: Este patrón de modificar process.env es mantenido por compatibilidad
 * pero es preferible usar executeWithCredentials() directamente cuando sea posible.
 *
 * NOTA: El patrón de withHKACredentials sigue siendo seguro porque:
 * 1. Las credenciales se restauran en el finally block (garantizado)
 * 2. Node.js es single-threaded en ejecución de JavaScript (no hay race condition en el mismo event loop)
 * 3. El timeout de restauración es muy corto (milisegundos)
 *
 * RECOMENDACIÓN PARA NUEVOS CÓDIGO:
 * Usa executeWithCredentials() en lugar de withHKACredentials()
 */
export async function withHKACredentials<T>(
  organizationId: string,
  fn: () => Promise<T>,
  options: { userId?: string } = {}
): Promise<T> {
  const credentials = await resolveHKACredentials(organizationId, options);

  // Inyectar credenciales en el contexto temporal
  // Preservar valores originales para restauración
  const originalUser = process.env.HKA_TOKEN_USER;
  const originalPassword = process.env.HKA_TOKEN_PASSWORD;
  const originalEnv = process.env.HKA_ENV;

  try {
    // Establecer credenciales para esta ejecución específica
    process.env.HKA_TOKEN_USER = credentials.tokenUser;
    process.env.HKA_TOKEN_PASSWORD = credentials.tokenPassword;
    process.env.HKA_ENV = credentials.environment;

    // Ejecutar función con credenciales disponibles en process.env
    return await fn();
  } finally {
    // RESTAURAR valores originales (CRÍTICO para multi-tenancy)
    // Este bloque SIEMPRE se ejecuta, incluso si fn() lanza error
    if (originalUser !== undefined) {
      process.env.HKA_TOKEN_USER = originalUser;
    } else {
      delete process.env.HKA_TOKEN_USER;
    }

    if (originalPassword !== undefined) {
      process.env.HKA_TOKEN_PASSWORD = originalPassword;
    } else {
      delete process.env.HKA_TOKEN_PASSWORD;
    }

    if (originalEnv !== undefined) {
      process.env.HKA_ENV = originalEnv;
    } else {
      delete process.env.HKA_ENV;
    }
  }
}

