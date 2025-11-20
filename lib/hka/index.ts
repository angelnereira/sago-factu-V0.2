/**
 * HKA Integration - Main Entry Point
 * Factory y re-exports
 */

import { prisma } from '@/lib/prisma';
import { HkaService } from './hka.service';
import type { HkaCredentials } from './types';

// Re-exports
export * from './types';
// export * from './constants/catalogs'; // TODO: Create this file
export * from './constants/endpoints';
export { HkaService } from './hka.service';
export { HkaXmlBuilder } from './builders/xml-builder';
export { HkaXmlParser } from './parsers/xml-parser';
export { HkaClient } from './hka.client';

/**
 * Factory: Crea instancia de HkaService para un usuario
 * Obtiene credenciales de BD y crea servicio
 *
 * @param userId - ID del usuario
 * @returns HkaService instance
 * @throws Error si no hay credenciales configuradas
 */
export async function createHkaService(userId: string): Promise<HkaService> {
  // Buscar credenciales activas del usuario
  const credential = await prisma.hKACredential.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });

  if (!credential) {
    throw new Error('HKA credentials not configured. Please configure in Settings.');
  }

  // TODO: Implement encryption/decryption
  // For now, passwords are stored in plaintext
  const password = credential.tokenPassword;

  // Construir credentials object
  const credentials: HkaCredentials = {
    tokenEmpresa: credential.tokenUser,
    tokenPassword: password,
    environment: credential.environment as 'DEMO' | 'PROD',
  };

  // Crear y retornar servicio
  return new HkaService(credentials);
}

/**
 * Factory alternativo: Crea HkaService con credenciales directas
 * Útil para testing o casos especiales
 *
 * @param credentials - Credenciales HKA
 * @returns HkaService instance
 */
export function createHkaServiceDirect(credentials: HkaCredentials): HkaService {
  return new HkaService(credentials);
}

/**
 * Verifica si un usuario tiene credenciales HKA configuradas
 *
 * @param userId - ID del usuario
 * @returns true si tiene credenciales activas
 */
export async function hasHkaCredentials(userId: string): Promise<boolean> {
  const count = await prisma.hKACredential.count({
    where: {
      userId,
      isActive: true,
    },
  });

  return count > 0;
}

/**
 * Obtiene el environment configurado para un usuario
 *
 * @param userId - ID del usuario
 * @returns 'DEMO' | 'PROD' | null
 */
export async function getUserHkaEnvironment(userId: string): Promise<'DEMO' | 'PROD' | null> {
  const credential = await prisma.hKACredential.findFirst({
    where: {
      userId,
      isActive: true,
    },
    select: {
      environment: true,
    },
  });

  return credential?.environment as 'DEMO' | 'PROD' | null;
}
