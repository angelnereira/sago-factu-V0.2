import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { AuditLogsList } from "@/components/admin/audit-logs-list"
import { AuditFilters } from "@/components/admin/audit-filters"

interface SearchParams {
  action?: string
  entity?: string
  user?: string
  page?: string
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/auth/signin")
  }

  // Solo SUPER_ADMIN puede ver logs de auditoría
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const pageSize = 50

  // Construir filtros
  const where: any = {}

  if (params.action) {
    where.action = params.action
  }

  if (params.entity) {
    where.entity = params.entity
  }

  if (params.user) {
    where.OR = [
      { userEmail: { contains: params.user, mode: "insensitive" } },
      { userId: params.user },
    ]
  }

  // Obtener logs con paginación
  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  // Obtener estadísticas
  const [actionStats, entityStats, recentCount] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: true,
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: 10,
    }),
    prisma.auditLog.groupBy({
      by: ["entity"],
      _count: true,
      orderBy: {
        _count: {
          entity: "desc",
        },
      },
      take: 10,
    }),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
        },
      },
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoría</h1>
          <p className="text-gray-600 mt-1">
            Registro completo de acciones realizadas en el sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Eventos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">Registros totales</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Últimas 24 horas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {recentCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">Eventos recientes</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tipos de Acción</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {actionStats.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">Acciones distintas</p>
        </div>
      </div>

      {/* Filters and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <AuditFilters
            currentFilters={{
              action: params.action,
              entity: params.entity,
              user: params.user,
            }}
            actionStats={actionStats.map((stat) => ({
              action: stat.action,
              count: stat._count,
            }))}
            entityStats={entityStats.map((stat) => ({
              entity: stat.entity,
              count: stat._count,
            }))}
          />
        </div>

        {/* Logs List */}
        <div className="lg:col-span-3">
          <AuditLogsList
            logs={logs.map((log) => ({
              id: log.id,
              action: log.action,
              entity: log.entity,
              entityId: log.entityId || "",
              userId: log.userId || "",
              userEmail: log.userEmail || "",
              changes: log.changes || "",
              ip: log.ip || "",
              userAgent: log.userAgent || "",
              createdAt: log.createdAt,
            }))}
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
          />
        </div>
      </div>
    </div>
  )
}

