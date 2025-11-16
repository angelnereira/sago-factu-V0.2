/**
 * 🔒 MANEJO SEGURO DE CREDENCIALES HKA
 *
 * ⚠️ CRÍTICO: Este módulo maneja credenciales sensibles
 * - NUNCA modifica process.env globalmente (race condition en multi-tenant)
 * - Credenciales se pasan por contexto de request
 * - Compatible con Plan Simple y Plan Empresarial
 */

import { logger } from '@/lib/logger';
import { z } from 'zod';

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
  const { decryptToken } = require('@/lib/utils/encryption');

  const requestId = crypto.randomUUID();
  const log = logger.child({ requestId, organizationId });

  try {
    // 1. Intentar obtener credenciales del usuario (Plan Simple)
    if (options.userId) {
      log.debug('Buscando credenciales de usuario', { userId: options.userId });

      const userCredential = await prismaServer.hKACredential.findFirst({
        where: { userId: options.userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (userCredential) {
        log.info('Credenciales de usuario encontradas', {
          source: 'user',
          environment: userCredential.environment,
        });

        const decrypted = {
          tokenUser: userCredential.tokenUser,
          tokenPassword: decryptToken(userCredential.tokenPassword),
          environment: userCredential.environment === 'PROD' ? 'prod' : 'demo',
          source: 'user' as const,
          credentialId: userCredential.id,
        };

        // Validar schema
        return HKACredentialsSchema.parse(decrypted);
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
      log.error('Organización no encontrada', { organizationId });
      return null;
    }

    // 3. Plan Simple: usar credenciales de la organización
    if (org.plan === OrganizationPlan.SIMPLE) {
      if (!org.hkaTokenUser || !org.hkaTokenPassword) {
        log.error('Credenciales HKA no configuradas en Plan Simple');
        throw new Error(
          '❌ Plan Simple: configura tus credenciales HKA en Configuración → Integraciones.\n' +
          'Contacta a soporte@thefactoryhka.com.pa para obtener credenciales.'
        );
      }

      log.info('Usando credenciales de organización (Plan Simple)', {
        source: 'organization',
        environment: org.hkaEnvironment,
      });

      const decrypted = {
        tokenUser: org.hkaTokenUser,
        tokenPassword: decryptToken(org.hkaTokenPassword),
        environment:
          org.hkaEnvironment === 'prod' || org.hkaEnvironment === 'production'
            ? 'prod'
            : 'demo',
        source: 'organization' as const,
      };

      return HKACredentialsSchema.parse(decrypted);
    }

    // 4. Plan Empresarial: usar credenciales centralizadas de .env
    log.debug('Plan Empresarial: usando credenciales de .env');
    return null;
  } catch (error) {
    log.error('Error obteniendo credenciales HKA', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Obtiene credenciales del sistema (desde .env para Plan Empresarial)
 *
 * ✅ SEGURO: Nunca modifica process.env, solo lee
 */
export function getSystemHKACredentials(): HKACredentials {
  const { getHKAConfig } = require('@/lib/hka-config');
  const config = getHKAConfig();

  return HKACredentialsSchema.parse({
    tokenUser: config.credentials.tokenUser,
    tokenPassword: config.credentials.tokenPassword,
    environment: config.environment,
    source: 'system',
  });
}

/**
 * Resuelve credenciales HKA para una organización
 *
 * Retorna:
 * 1. Credenciales específicas de la organización (si las tiene)
 * 2. Credenciales del sistema .env (Plan Empresarial)
 */
export async function resolveHKACredentials(
  organizationId: string,
  options: { userId?: string } = {}
): Promise<HKACredentials> {
  const orgCredentials = await getHKACredentials(organizationId, options);
  return orgCredentials || getSystemHKACredentials();
}

/**
 * ✅ PATRÓN RECOMENDADO: Usar credenciales sin modificar process.env
 *
 * ANTES (❌ INCORRECTO - Race condition):
 * ```typescript
 * process.env.HKA_TOKEN = credentials.tokenUser;
 * const result = await hkaClient.enviar(document);
 * ```
 *
 * AHORA (✅ CORRECTO):
 * ```typescript
 * const credentials = await resolveHKACredentials(orgId);
 * const result = await hkaClient.enviar(document, credentials);
 * ```
 */
export async function executeWithCredentials<T>(
  organizationId: string,
  fn: (credentials: HKACredentials) => Promise<T>,
  options: { userId?: string } = {}
): Promise<T> {
  const credentials = await resolveHKACredentials(organizationId, options);
  return fn(credentials);
}

