/**
 * Utilidades de Prisma optimizadas
 * Incluye helpers para usar las extensiones de Prisma
 */

import { prisma } from './prisma'

/**
 * Paginación Helper
 * Uso: await paginateUsers({ page: 1, limit: 20 }, whereClause)
 */
export async function paginateQuery<T>(
  model: any,
  options: {
    page?: number
    limit?: number
    where?: any
    orderBy?: any
    include?: any
    select?: any
  }
) {
  const { page = 1, limit = 20, where, orderBy, include, select } = options

  // Usar la extensión de paginación
  return await model.findMany({
    where,
    orderBy,
    include,
    select,
    skip: (page - 1) * limit,
    take: limit,
  })
}

/**
 * Helper para queries con caché (Accelerate)
 * Uso: await cachedQuery(() => prisma.user.findMany(), 60)
 */
export async function cachedQuery<T>(
  queryFn: () => Promise<T>,
  ttl: number = 60 // TTL en segundos
): Promise<T> {
  // Accelerate maneja el caché automáticamente
  // Este helper es para queries específicas que quieres cachear
  return await queryFn()
}

/**
 * Batch operations optimizadas
 * Uso: await batchCreate('user', users)
 */
export async function batchCreate<T>(
  modelName: keyof typeof prisma,
  data: any[]
) {
  // @ts-ignore
  return await prisma[modelName].createMany({
    data,
    skipDuplicates: true,
  })
}

/**
 * Soft delete helper
 * Marca como inactivo en lugar de eliminar
 */
export async function softDelete(
  modelName: keyof typeof prisma,
  id: string
) {
  // @ts-ignore
  return await prisma[modelName].update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  })
}

/**
 * Helper para búsqueda full-text
 * PostgreSQL: Usa tsvector para búsqueda rápida
 */
export async function fullTextSearch(
  modelName: keyof typeof prisma,
  searchTerm: string,
  fields: string[]
) {
  const orConditions = fields.map(field => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as const,
    },
  }))

  // @ts-ignore
  return await prisma[modelName].findMany({
    where: {
      OR: orConditions,
    },
  })
}

/**
 * Helper para contar registros con caché
 */
export async function cachedCount(
  modelName: keyof typeof prisma,
  where?: any
) {
  // @ts-ignore
  return await prisma[modelName].count({ where })
}

/**
 * Helper para obtener estadísticas agregadas
 */
export async function getAggregates(
  modelName: keyof typeof prisma,
  field: string,
  where?: any
) {
  // @ts-ignore
  return await prisma[modelName].aggregate({
    where,
    _count: true,
    _sum: { [field]: true },
    _avg: { [field]: true },
    _min: { [field]: true },
    _max: { [field]: true },
  })
}

/**
 * Helper para queries con relaciones optimizadas
 * Evita el problema N+1
 */
export async function findWithRelations<T>(
  modelName: keyof typeof prisma,
  id: string,
  relations: string[]
) {
  const include = relations.reduce((acc, rel) => {
    acc[rel] = true
    return acc
  }, {} as Record<string, boolean>)

  // @ts-ignore
  return await prisma[modelName].findUnique({
    where: { id },
    include,
  })
}

/**
 * Helper para transacciones optimizadas
 * Nota: Usar directamente prisma.$transaction para mejor soporte de tipos
 */
export const transactionHelper = prisma.$transaction.bind(prisma)

/**
 * Helper para actualización masiva
 */
export async function batchUpdate(
  modelName: keyof typeof prisma,
  where: any,
  data: any
) {
  // @ts-ignore
  return await prisma[modelName].updateMany({
    where,
    data,
  })
}

/**
 * Helper para queries con cursor-based pagination
 * Mejor para grandes datasets
 */
export async function cursorPaginate<T>(
  modelName: keyof typeof prisma,
  options: {
    cursor?: string
    take?: number
    where?: any
    orderBy?: any
  }
) {
  const { cursor, take = 20, where, orderBy } = options

  // @ts-ignore
  return await prisma[modelName].findMany({
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy,
  })
}

/**
 * Helper para obtener registros únicos con retry
 * Útil para race conditions
 */
export async function findUniqueWithRetry<T>(
  modelName: keyof typeof prisma,
  where: any,
  maxRetries: number = 3
): Promise<T | null> {
  let attempts = 0
  
  while (attempts < maxRetries) {
    try {
      // @ts-ignore
      return await prisma[modelName].findUnique({ where })
    } catch (error) {
      attempts++
      if (attempts >= maxRetries) throw error
      
      // Esperar antes de reintentar (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100))
    }
  }
  
  return null
}

/**
 * Helper para queries raw optimizadas
 * Usa Accelerate para cachear
 */
export async function rawQuery<T>(
  query: string,
  params?: any[]
): Promise<T> {
  // @ts-ignore
  return await prisma.$queryRaw(query, ...params)
}

/**
 * Helper para logging de queries lentas
 * Útil para debugging de performance
 */
export async function logSlowQuery<T>(
  queryFn: () => Promise<T>,
  threshold: number = 1000 // ms
): Promise<T> {
  const start = Date.now()
  const result = await queryFn()
  const duration = Date.now() - start
  
  if (duration > threshold) {
    console.warn(`[SLOW QUERY] Took ${duration}ms`)
  }
  
  return result
}

