/**
 * Ejemplos de Queries Optimizadas con Prisma Extensions
 * 
 * Estos ejemplos muestran cómo usar las extensiones de Prisma
 * para mejorar el rendimiento de tus queries
 */

import { prisma } from '../prisma'
import {
  paginateQuery,
  cachedQuery,
  batchCreate,
  fullTextSearch,
  findWithRelations,
  cursorPaginate,
} from '../prisma-utils'

// ============================================
// 1. PAGINACIÓN OPTIMIZADA
// ============================================

/**
 * Paginación de usuarios con Offset
 * ✅ Mejor para: Páginas pequeñas, UI simple
 */
export async function getUsersPageOffset(page: number = 1, limit: number = 20) {
  return await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organization: {
        select: { name: true, slug: true }
      }
    }
  })
}

/**
 * Paginación con Cursor
 * ✅ Mejor para: Infinite scroll, grandes datasets
 */
export async function getUsersPageCursor(cursor?: string, limit: number = 20) {
  return await cursorPaginate('user', {
    cursor,
    take: limit,
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

// ============================================
// 2. BÚSQUEDA OPTIMIZADA
// ============================================

/**
 * Búsqueda full-text de usuarios
 * ✅ Cacheo automático con Accelerate
 */
export async function searchUsers(searchTerm: string) {
  return await fullTextSearch('user', searchTerm, ['name', 'email'])
}

/**
 * Búsqueda de facturas con filtros
 * ✅ Query optimizada con índices
 */
export async function searchInvoices(filters: {
  status?: string
  organizationId?: string
  dateFrom?: Date
  dateTo?: Date
}) {
  return await prisma.invoice.findMany({
    where: {
      organizationId: filters.organizationId,
      status: filters.status as any,
      issueDate: {
        gte: filters.dateFrom,
        lte: filters.dateTo,
      },
    },
    include: {
      items: true,
      organization: {
        select: { name: true }
      },
    },
    orderBy: { issueDate: 'desc' },
    take: 100,
  })
}

// ============================================
// 3. AGREGACIONES Y ESTADÍSTICAS
// ============================================

/**
 * Dashboard de organización
 * ✅ Múltiples queries optimizadas
 */
export async function getOrganizationDashboard(organizationId: string) {
  // Ejecutar todas las queries en paralelo
  const [
    totalInvoices,
    totalUsers,
    recentInvoices,
    invoiceStats,
  ] = await Promise.all([
    // Total de facturas
    prisma.invoice.count({
      where: { organizationId },
    }),
    
    // Total de usuarios
    prisma.user.count({
      where: { organizationId, isActive: true },
    }),
    
    // Últimas 10 facturas
    prisma.invoice.findMany({
      where: { organizationId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        issueDate: true,
      },
    }),
    
    // Estadísticas de facturas
    prisma.invoice.aggregate({
      where: { organizationId },
      _sum: { total: true },
      _avg: { total: true },
      _count: true,
    }),
  ])

  return {
    totalInvoices,
    totalUsers,
    recentInvoices,
    stats: {
      totalRevenue: invoiceStats._sum.total,
      averageInvoice: invoiceStats._avg.total,
      invoiceCount: invoiceStats._count,
    },
  }
}

/**
 * Estadísticas de folios
 * ✅ Agregación optimizada
 */
export async function getFolioStats(organizationId: string) {
  const assignments = await prisma.folioAssignment.findMany({
    where: { organizationId },
    include: {
      folioPool: {
        select: {
          provider: true,
          totalFolios: true,
        }
      }
    }
  })

  return assignments.reduce((acc, assignment) => {
    return {
      totalAssigned: acc.totalAssigned + assignment.assignedAmount,
      totalConsumed: acc.totalConsumed + assignment.consumedAmount,
      totalAvailable: acc.totalAvailable + (assignment.assignedAmount - assignment.consumedAmount),
    }
  }, { totalAssigned: 0, totalConsumed: 0, totalAvailable: 0 })
}

// ============================================
// 4. OPERACIONES BATCH
// ============================================

/**
 * Crear múltiples items de factura
 * ✅ Batch insert optimizado
 */
export async function createInvoiceItems(invoiceId: string, items: any[]) {
  return await batchCreate('invoiceItem', 
    items.map((item, index) => ({
      invoiceId,
      lineNumber: index + 1,
      code: item.code,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      discountRate: item.discountRate || 0,
      taxRate: item.taxRate || 7,
      taxCode: item.taxCode || '01',
      taxAmount: item.taxAmount,
      subtotal: item.subtotal,
      total: item.total,
      unit: item.unit || 'UND',
    }))
  )
}

/**
 * Actualizar estado de múltiples facturas
 * ✅ Batch update
 */
export async function updateInvoicesStatus(invoiceIds: string[], status: string) {
  return await prisma.invoice.updateMany({
    where: {
      id: { in: invoiceIds },
    },
    data: {
      status: status as any,
      updatedAt: new Date(),
    },
  })
}

// ============================================
// 5. TRANSACCIONES
// ============================================

/**
 * Crear factura completa con items
 * ✅ Transacción atómica
 */
export async function createCompleteInvoice(data: {
  invoice: any
  items: any[]
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Crear factura
    const invoice = await tx.invoice.create({
      data: data.invoice,
    })

    // 2. Crear items de factura
    await tx.invoiceItem.createMany({
      data: data.items,
      skipDuplicates: true,
    })

    // 3. Registrar log
    await tx.invoiceLog.create({
      data: {
        invoiceId: invoice.id,
        action: 'CREATED',
        message: 'Factura creada exitosamente',
      },
    })

    return invoice
  })
}

/**
 * Transferir folios entre organizaciones
 * ✅ Transacción con rollback automático
 */
export async function transferFolios(
  fromOrgId: string,
  toOrgId: string,
  amount: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Reducir de organización origen
    const fromAssignment = await tx.folioAssignment.findFirst({
      where: { organizationId: fromOrgId },
    })

    if (!fromAssignment || fromAssignment.assignedAmount < amount) {
      throw new Error('Folios insuficientes')
    }

    await tx.folioAssignment.update({
      where: { id: fromAssignment.id },
      data: {
        assignedAmount: {
          decrement: amount,
        },
      },
    })

    // 2. Incrementar en organización destino
    const toAssignment = await tx.folioAssignment.findFirst({
      where: { organizationId: toOrgId },
    })

    if (toAssignment) {
      await tx.folioAssignment.update({
        where: { id: toAssignment.id },
        data: {
          assignedAmount: {
            increment: amount,
          },
        },
      })
    }

    // 3. Registrar en audit log
    await tx.auditLog.create({
      data: {
        action: 'FOLIO_TRANSFER',
        entity: 'FolioAssignment',
        entityId: `${fromOrgId}-${toOrgId}`,
        changes: JSON.parse(JSON.stringify({
          from: fromOrgId,
          to: toOrgId,
          amount,
        })),
      },
    })

    return { success: true, amount }
  })
}

// ============================================
// 6. QUERIES CON CACHÉ
// ============================================

/**
 * Obtener configuración del sistema (cacheada)
 * ✅ TTL de 5 minutos
 */
export async function getSystemConfig() {
  return await cachedQuery(
    () => prisma.systemConfig.findMany(),
    300 // 5 minutos
  )
}

/**
 * Obtener organizaciones activas (cacheada)
 * ✅ TTL de 1 minuto
 */
export async function getActiveOrganizations() {
  return await cachedQuery(
    () => prisma.organization.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        ruc: true,
      },
    }),
    60
  )
}

// ============================================
// 7. RELACIONES OPTIMIZADAS
// ============================================

/**
 * Obtener factura con todas las relaciones
 * ✅ Evita problema N+1
 */
export async function getInvoiceWithRelations(invoiceId: string) {
  return await findWithRelations('invoice', invoiceId, [
    'items',
    'organization',
    'user',
    'logs',
    'folioConsumption',
  ])
}

/**
 * Obtener usuario con organización y permisos
 * ✅ Single query con includes
 */
export async function getUserComplete(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: {
        include: {
          folios: {
            include: {
              folioPool: true,
            },
          },
        },
      },
      invoices: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// ============================================
// EXPORTAR TODAS LAS FUNCIONES
// ============================================

export const optimizedQueries = {
  // Paginación
  getUsersPageOffset,
  getUsersPageCursor,
  
  // Búsqueda
  searchUsers,
  searchInvoices,
  
  // Dashboard
  getOrganizationDashboard,
  getFolioStats,
  
  // Batch
  createInvoiceItems,
  updateInvoicesStatus,
  
  // Transacciones
  createCompleteInvoice,
  transferFolios,
  
  // Caché
  getSystemConfig,
  getActiveOrganizations,
  
  // Relaciones
  getInvoiceWithRelations,
  getUserComplete,
}

