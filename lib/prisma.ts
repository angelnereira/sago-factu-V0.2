import { PrismaClient, Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { pagination } from 'prisma-extension-pagination'
import { fieldEncryptionExtension } from 'prisma-field-encryption'

// Configuración de logging según el ambiente
const logConfig: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn']
  : ['error']

// Global para almacenar el cliente
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

// Función para crear el cliente con todas las extensiones
function createPrismaClient() {
  const baseClient = new PrismaClient({
    log: logConfig,
    // Optimizaciones de conexión
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // Aplicar extensiones en cadena
  let client = baseClient
    // 1. Accelerate: Caching y connection pooling
    .$extends(withAccelerate())
    
    // 2. Paginación: Facilita queries paginadas
    .$extends(
      pagination({
        pages: {
          limit: 20, // Límite por defecto
          includePageCount: true, // Incluir total de páginas
        },
      })
    )
  
  // 3. Encriptación de campos sensibles (solo si hay clave configurada)
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32) {
    client = client.$extends(
      fieldEncryptionExtension({
        encryptionKey: process.env.ENCRYPTION_KEY,
      })
    ) as any
  }
  
  return client
}

// Crear o reutilizar el cliente
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// En desarrollo, guardar en global para hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Tipo exportado para usar en toda la app
export type PrismaClientExtended = typeof prisma
