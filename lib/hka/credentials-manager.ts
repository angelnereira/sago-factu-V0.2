/**
 * Maneja credenciales HKA según el plan de la organización
 */

export interface HKAOrganizationCredentials {
  tokenUser: string;
  tokenPassword: string;
  environment: 'demo' | 'prod';
}

export async function getHKACredentials(
  organizationId: string
): Promise<HKAOrganizationCredentials | null> {
  const { prismaServer: prisma } = await import('@/lib/prisma-server');
  const { OrganizationPlan } = await import('@prisma/client');
  const { decryptToken } = await import('@/lib/utils/encryption');

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { 
      plan: true, 
      hkaTokenUser: true, 
      hkaTokenPassword: true, 
      hkaEnvironment: true 
    }
  });

  if (!org) return null;

  // Plan Simple: usar credenciales propias del usuario
  if (org.plan === OrganizationPlan.SIMPLE) {
    if (!org.hkaTokenUser || !org.hkaTokenPassword) {
      throw new Error(
        'Plan Simple: Configure sus credenciales HKA en Configuración. ' +
        'Vaya a /simple/configuracion para configurar sus credenciales.'
      );
    }
    
    return {
      tokenUser: org.hkaTokenUser,
      tokenPassword: decryptToken(org.hkaTokenPassword),
      environment: (org.hkaEnvironment || 'demo') as 'demo' | 'prod'
    };
  }

  // Plan Empresarial o Super Admin: retornar null (usa credenciales centralizadas de .env)
  return null;
}

/**
 * Ejecuta una función HKA con credenciales específicas según el plan
 * 
 * Para Plan Simple: override temporal de variables de entorno
 * Para Plan Empresarial: ejecuta con credenciales centralizadas (.env)
 */
export async function withHKACredentials<T>(
  organizationId: string,
  fn: () => Promise<T>
): Promise<T> {
  const credentials = await getHKACredentials(organizationId);

  if (!credentials) {
    // Plan Empresarial: ejecutar normal con credenciales de .env
    return fn();
  }

  // Plan Simple: override temporal de variables de entorno
  const originalToken = process.env.HKA_DEMO_TOKEN_USER;
  const originalPassword = process.env.HKA_DEMO_TOKEN_PASSWORD;
  const originalEnv = process.env.HKA_ENV;

  try {
    // Establecer credenciales del usuario
    process.env.HKA_DEMO_TOKEN_USER = credentials.tokenUser;
    process.env.HKA_DEMO_TOKEN_PASSWORD = credentials.tokenPassword;
    process.env.HKA_ENV = credentials.environment;

    console.log(`[HKA] Usando credenciales de Plan Simple para org ${organizationId}`);
    console.log(`[HKA] Environment: ${credentials.environment}`);

    return await fn();
  } finally {
    // Restaurar valores originales
    if (originalToken) process.env.HKA_DEMO_TOKEN_USER = originalToken;
    if (originalPassword) process.env.HKA_DEMO_TOKEN_PASSWORD = originalPassword;
    if (originalEnv) process.env.HKA_ENV = originalEnv;
  }
}

