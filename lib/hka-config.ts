/**
 * Configuración de The Factory HKA
 * ⚠️ SECURITY-CRITICAL: Credenciales NUNCA hardcodeadas
 *
 * Todas las credenciales DEBEN provenir de variables de entorno.
 * Si falta alguna, la aplicación fallaría al iniciar (fail-fast approach).
 */

import { z } from 'zod';

// ============================================================================
// SCHEMA VALIDATION - Validar credenciales al iniciar
// ============================================================================

const HKACredentialsSchema = z.object({
  tokenUser: z.string()
    .min(1, '❌ CRÍTICO: HKA_DEMO_TOKEN_USER no está configurado'),
  tokenPassword: z.string()
    .min(1, '❌ CRÍTICO: HKA_DEMO_TOKEN_PASSWORD no está configurado'),
});

const HKAConfigSchema = z.object({
  environment: z.enum(['demo', 'production']),
  soapUrl: z.string().url('SOAP URL inválida'),
  restUrl: z.string().url('REST URL inválida'),
  credentials: HKACredentialsSchema,
});

export type HKAConfig = z.infer<typeof HKAConfigSchema>;

// ============================================================================
// VALIDACIÓN AL INICIAR LA APLICACIÓN
// ============================================================================

function validateEnvironmentVariables(): void {
  const missingVars: string[] = [];

  // Credenciales DEMO - SIEMPRE requeridas
  if (!process.env.HKA_DEMO_TOKEN_USER) {
    missingVars.push('HKA_DEMO_TOKEN_USER');
  }
  if (!process.env.HKA_DEMO_TOKEN_PASSWORD) {
    missingVars.push('HKA_DEMO_TOKEN_PASSWORD');
  }

  // Credenciales PRODUCCIÓN - Requeridas si HKA_ENV=production
  if (process.env.HKA_ENV === 'production') {
    if (!process.env.HKA_PROD_TOKEN_USER) {
      missingVars.push('HKA_PROD_TOKEN_USER (requerido para ambiente PRODUCCIÓN)');
    }
    if (!process.env.HKA_PROD_TOKEN_PASSWORD) {
      missingVars.push('HKA_PROD_TOKEN_PASSWORD (requerido para ambiente PRODUCCIÓN)');
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = [
      '',
      '🔴 ============================================================================',
      '🔴 ERROR CRÍTICO: VARIABLES DE ENTORNO HKA FALTANTES',
      '🔴 ============================================================================',
      '',
      `Las siguientes variables no están configuradas:`,
      ...missingVars.map(v => `  ❌ ${v}`),
      '',
      'SOLUCIÓN:',
      '1. Copiar .env.example a .env: cp .env.example .env',
      '2. Solicitar credenciales a The Factory HKA: soporte@thefactoryhka.com.pa',
      '3. Configurar en .env:',
      `   HKA_DEMO_TOKEN_USER=valor_aqui`,
      `   HKA_DEMO_TOKEN_PASSWORD=valor_aqui`,
      '',
      'Ref: https://felwiki.thefactoryhka.com.pa/',
      '🔴 ============================================================================',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

// Ejecutar validación al importar este módulo
validateEnvironmentVariables();

// ============================================================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================================================

export function getHKAConfig(): HKAConfig {
  const environment = (process.env.HKA_ENV as 'demo' | 'production') || 'demo';

  if (environment === 'demo') {
    const config: HKAConfig = {
      environment: 'demo',
      soapUrl: process.env.HKA_DEMO_SOAP_URL || 'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
      restUrl: process.env.HKA_DEMO_REST_URL || 'https://demointegracion.thefactoryhka.com.pa',
      credentials: {
        tokenUser: process.env.HKA_DEMO_TOKEN_USER!,
        tokenPassword: process.env.HKA_DEMO_TOKEN_PASSWORD!,
      },
    };
    return HKAConfigSchema.parse(config);
  }

  // Producción
  const config: HKAConfig = {
    environment: 'production',
    soapUrl: process.env.HKA_PROD_SOAP_URL || 'https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
    restUrl: process.env.HKA_PROD_REST_URL || 'https://integracion.thefactoryhka.com.pa',
    credentials: {
      tokenUser: process.env.HKA_PROD_TOKEN_USER!,
      tokenPassword: process.env.HKA_PROD_TOKEN_PASSWORD!,
    },
  };
  return HKAConfigSchema.parse(config);
}

export function validateHKAConfig(): { isValid: boolean; errors: string[] } {
  try {
    getHKAConfig();
    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Configuración HKA inválida'],
    };
  }
}

export function getHKAEnvironment(): string {
  return process.env.HKA_ENV || 'demo'
}

export function isHKAProduction(): boolean {
  return getHKAEnvironment() === 'production'
}

export function isHKADemo(): boolean {
  return getHKAEnvironment() === 'demo'
}
