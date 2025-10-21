/**
 * Prisma Client Singleton Pattern
 * 
 * Implementa el patrón singleton recomendado por Prisma para Next.js
 * para evitar múltiples instancias y agotamiento de conexiones.
 * 
 * @see https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prismaBase = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prismaBase

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prismaBase
}

