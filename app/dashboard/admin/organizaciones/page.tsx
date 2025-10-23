import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { OrganizationsTable } from "@/components/admin/organizations-table"
import { Building2, Users, Ticket, FileText } from "lucide-react"

export default async function OrganizationsPage() {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/")
  }

  // Solo SUPER_ADMIN puede ver organizaciones
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  // Obtener todas las organizaciones con estadísticas
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          invoices: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Calcular estadísticas agregadas
  const stats = {
    total: organizations.length,
    active: organizations.filter((org) => org.isActive).length,
    inactive: organizations.filter((org) => !org.isActive).length,
    totalUsers: organizations.reduce((sum, org) => sum + org._count.users, 0),
    totalInvoices: organizations.reduce((sum, org) => sum + org._count.invoices, 0),
  }

  // Obtener folios por organización
  const folioStats = await prisma.folioAssignment.groupBy({
    by: ["organizationId"],
    _sum: {
      assignedAmount: true,
      consumedAmount: true,
    },
  })

  // Crear un mapa de folios por organización
  const foliosMap = new Map(
    folioStats.map((stat) => [
      stat.organizationId,
      {
        assigned: stat._sum.assignedAmount || 0,
        consumed: stat._sum.consumedAmount || 0,
        available: (stat._sum.assignedAmount || 0) - (stat._sum.consumedAmount || 0),
      },
    ])
  )

  // Agregar estadísticas de folios a cada organización
  const organizationsWithFolios = organizations.map((org) => ({
    ...org,
    folios: foliosMap.get(org.id) || { assigned: 0, consumed: 0, available: 0 },
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Organizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra las organizaciones registradas en el sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Organizaciones
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 dark:text-green-400 font-medium">{stats.active} activas</span>
            <span className="text-gray-400 dark:text-gray-500 mx-2">•</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{stats.inactive} inactivas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.totalUsers}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            En todas las organizaciones
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Folios</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {folioStats.reduce((sum, stat) => sum + (stat._sum.assignedAmount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Ticket className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Folios asignados
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Facturas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.totalInvoices.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Facturas emitidas
          </p>
        </div>
      </div>

      {/* Organizations Table */}
      <OrganizationsTable organizations={organizationsWithFolios} />
    </div>
  )
}

