/**
 * Prisma Client para Server Actions y Server Components
 * 
 * Este cliente NO usa extensiones para evitar problemas de tipos
 * en Server Actions que requieren serialización.
 * 
 * Usar este cliente en:
 * - Server Actions
 * - API Routes que modifican datos
 * - Formularios con Server Actions
 * 
 * Para queries de lectura optimizadas, usar lib/prisma.ts
 */

import { PrismaClient } from '@prisma/client'

const globalForPrismaServer = globalThis as unknown as {
  prismaServer: PrismaClient | undefined
}

export const prismaServer = 
  globalForPrismaServer.prismaServer ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaServer.prismaServer = prismaServer
}

// Export default para imports más simples
export default prismaServer

