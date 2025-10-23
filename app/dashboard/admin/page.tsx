import { redirect } from "next/navigation"
import { Users, Building2, Ticket, Activity } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function AdminDashboardPage() {
  const session = await auth()

  // Verificar que el usuario sea Super Admin
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  // Obtener estadísticas del sistema
  const [
    totalUsers,
    totalOrganizations,
    totalInvoices,
    totalFolios,
    recentUsers,
    recentOrganizations,
    invoiceStats,
  ] = await Promise.all([
    // Total de usuarios
    prisma.user.count(),
    
    // Total de organizaciones
    prisma.organization.count(),
    
    // Total de facturas
    prisma.invoice.count(),
    
    // Total de folios en pools
    prisma.folioPool.aggregate({
      _sum: {
        totalFolios: true,
      },
    }).then(result => result._sum.totalFolios || 0),
    
    // Usuarios recientes (últimos 5)
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        organizationId: true,
      },
    }),
    
    // Organizaciones recientes (últimas 5)
    prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        ruc: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    }),
    
    // Estadísticas de facturas por estado
    prisma.invoice.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    }),
  ])

  // Calcular métricas
  const activeUsers = await prisma.user.count({
    where: { isActive: true },
  })

  const certifiedInvoices = invoiceStats.find(s => s.status === "CERTIFIED")?._count.status || 0
  const pendingInvoices = invoiceStats.find(s => s.status === "DRAFT")?._count.status || 0
  const failedInvoices = invoiceStats.find(s => s.status === "ERROR")?._count.status || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="mt-2 text-gray-600">
          Vista general del sistema y gestión de usuarios y organizaciones
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Usuarios */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalUsers}</p>
              <p className="mt-1 text-sm text-green-600">{activeUsers} activos</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Organizaciones */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organizaciones</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalOrganizations}</p>
              <p className="mt-1 text-sm text-gray-500">Empresas registradas</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Folios */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Folios Totales</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalFolios}</p>
              <p className="mt-1 text-sm text-gray-500">En el sistema</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Ticket className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Facturas */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Facturas Totales</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalInvoices}</p>
              <div className="mt-1 flex items-center space-x-2 text-xs">
                <span className="text-green-600">{certifiedInvoices} cert.</span>
                <span className="text-red-600">{failedInvoices} error</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/admin/users"
          className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gestionar Usuarios</h3>
              <p className="text-sm text-gray-600">Ver, crear y editar usuarios</p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/admin/organizations"
          className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Organizaciones</h3>
              <p className="text-sm text-gray-600">Administrar empresas</p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/admin/folios"
          className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Ticket className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gestión de Folios</h3>
              <p className="text-sm text-gray-600">Asignar y monitorear</p>
            </div>
          </div>
        </a>
      </div>

      {/* Recent Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuarios Recientes */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Usuarios Recientes</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay usuarios registrados
                </p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        user.role === "SUPER_ADMIN" 
                          ? "bg-red-100 text-red-800"
                          : user.role === "ORG_ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href="/dashboard/admin/users"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver todos los usuarios →
              </a>
            </div>
          </div>
        </div>

        {/* Organizaciones Recientes */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Organizaciones Recientes</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrganizations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay organizaciones registradas
                </p>
              ) : (
                recentOrganizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{org.name}</p>
                        <p className="text-xs text-gray-500">RUC: {org.ruc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {org._count.users} usuarios
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href="/dashboard/admin/organizations"
                className="text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                Ver todas las organizaciones →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Estado del Sistema</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Facturas Certificadas</span>
                <span className="text-sm font-bold text-green-600">
                  {totalInvoices > 0 ? Math.round((certifiedInvoices / totalInvoices) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${totalInvoices > 0 ? (certifiedInvoices / totalInvoices) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Usuarios Activos</span>
                <span className="text-sm font-bold text-blue-600">
                  {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Tasa de Error</span>
                <span className="text-sm font-bold text-red-600">
                  {totalInvoices > 0 ? Math.round((failedInvoices / totalInvoices) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${totalInvoices > 0 ? (failedInvoices / totalInvoices) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

