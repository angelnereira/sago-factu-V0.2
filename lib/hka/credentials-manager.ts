/**
 * Maneja credenciales HKA según el plan de la organización
 */

export interface HKAOrganizationCredentials {
  tokenUser: string;
  tokenPassword: string;
  environment: 'demo' | 'prod';
  source: 'user' | 'organization';
  credentialId?: string;
}

export async function getHKACredentials(
  organizationId: string,
  options: { userId?: string } = {}
): Promise<HKAOrganizationCredentials | null> {
  const { prismaServer: prisma } = await import('@/lib/prisma-server');
  const { OrganizationPlan } = await import('@prisma/client');
  const { decryptToken } = await import('@/lib/utils/encryption');

  if (options.userId) {
    const userCredential = await prisma.hKACredential.findFirst({
      where: { userId: options.userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (userCredential) {
      return {
        tokenUser: userCredential.tokenUser,
        tokenPassword: decryptToken(userCredential.tokenPassword),
        environment: userCredential.environment === 'PROD' ? 'prod' : 'demo',
        source: 'user',
        credentialId: userCredential.id,
      };
    }
  }

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
        'Plan Simple: configura tus credenciales HKA personales en Configuración → Integraciones (o /simple/configuracion).'
      );
    }
    
    return {
      tokenUser: org.hkaTokenUser,
      tokenPassword: decryptToken(org.hkaTokenPassword),
      environment: (org.hkaEnvironment || 'demo') === 'prod' || (org.hkaEnvironment || 'demo') === 'production' ? 'prod' : 'demo',
      source: 'organization',
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
  fn: () => Promise<T>,
  options: { userId?: string } = {}
): Promise<T> {
  const credentials = await getHKACredentials(organizationId, options);

  if (!credentials) {
    // Plan Empresarial: ejecutar normal con credenciales de .env
    return fn();
  }

  // Plan Simple: override temporal de variables de entorno
  const originalDemoToken = process.env.HKA_DEMO_TOKEN_USER;
  const originalDemoPassword = process.env.HKA_DEMO_TOKEN_PASSWORD;
  const originalProdToken = process.env.HKA_PROD_TOKEN_USER;
  const originalProdPassword = process.env.HKA_PROD_TOKEN_PASSWORD;
  const originalEnv = process.env.HKA_ENV;
  const originalEnvCompat = process.env.HKA_ENVIRONMENT;

  try {
    // Establecer credenciales del usuario
    if (credentials.environment === 'prod') {
      process.env.HKA_ENV = 'prod';
      process.env.HKA_ENVIRONMENT = 'production';
      process.env.HKA_PROD_TOKEN_USER = credentials.tokenUser;
      process.env.HKA_PROD_TOKEN_PASSWORD = credentials.tokenPassword;
    } else {
      process.env.HKA_ENV = 'demo';
      process.env.HKA_ENVIRONMENT = 'demo';
      process.env.HKA_DEMO_TOKEN_USER = credentials.tokenUser;
      process.env.HKA_DEMO_TOKEN_PASSWORD = credentials.tokenPassword;
    }

    console.log(`[HKA] Usando credenciales ${credentials.source} para org ${organizationId}`);
    console.log(`[HKA] Environment activo: ${credentials.environment}`);

    const result = await fn();

    if (credentials.source === 'user' && credentials.credentialId) {
      const { prismaServer: prisma } = await import('@/lib/prisma-server');
      await prisma.hKACredential.update({
        where: { id: credentials.credentialId },
        data: { lastUsedAt: new Date() },
      });
    }

    return result;
  } finally {
    // Restaurar valores originales
    if (originalDemoToken !== undefined) {
      process.env.HKA_DEMO_TOKEN_USER = originalDemoToken;
    } else {
      delete process.env.HKA_DEMO_TOKEN_USER;
    }

    if (originalDemoPassword !== undefined) {
      process.env.HKA_DEMO_TOKEN_PASSWORD = originalDemoPassword;
    } else {
      delete process.env.HKA_DEMO_TOKEN_PASSWORD;
    }

    if (originalProdToken !== undefined) {
      process.env.HKA_PROD_TOKEN_USER = originalProdToken;
    } else {
      delete process.env.HKA_PROD_TOKEN_USER;
    }

    if (originalProdPassword !== undefined) {
      process.env.HKA_PROD_TOKEN_PASSWORD = originalProdPassword;
    } else {
      delete process.env.HKA_PROD_TOKEN_PASSWORD;
    }

    if (originalEnv !== undefined) {
      process.env.HKA_ENV = originalEnv;
    } else {
      delete process.env.HKA_ENV;
    }

    if (originalEnvCompat !== undefined) {
      process.env.HKA_ENVIRONMENT = originalEnvCompat;
    } else {
      delete process.env.HKA_ENVIRONMENT;
    }
  }
}

