import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { pagination } from 'prisma-extension-pagination'
import { fieldEncryptionExtension } from 'prisma-field-encryption'

// Configuración de logging según el ambiente
const logConfig = process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn'] as const
  : ['error'] as const

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
  return baseClient
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
    
    // 3. Encriptación de campos sensibles (opcional, configurable por modelo)
    .$extends(
      fieldEncryptionExtension({
        encryptionKey: process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-production',
      })
    )
}

// Crear o reutilizar el cliente
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// En desarrollo, guardar en global para hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Tipo exportado para usar en toda la app
export type PrismaClientExtended = typeof prisma
