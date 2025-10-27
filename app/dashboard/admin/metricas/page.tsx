import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { MetricsOverview } from "@/components/admin/metrics-overview"
import { SystemStats } from "@/components/admin/system-stats"
import { ActivityChart } from "@/components/admin/activity-chart"
import { TopOrganizations } from "@/components/admin/top-organizations"

export default async function MetricsPage() {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/")
  }

  // Solo SUPER_ADMIN puede ver métricas del sistema
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  // Obtener métricas generales
  const [
    totalOrganizations,
    totalUsers,
    totalInvoices,
    activeOrganizations,
    recentUsers,
    recentInvoices,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.invoice.count(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        },
      },
    }),
    prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        },
      },
    }),
  ])

  // Estadísticas de folios
  const folioStats = await prisma.folioAssignment.aggregate({
    _sum: {
      assignedAmount: true,
      consumedAmount: true,
    },
  })

  const totalFoliosAssigned = folioStats._sum.assignedAmount || 0
  const totalFoliosConsumed = folioStats._sum.consumedAmount || 0
  const totalFoliosAvailable = totalFoliosAssigned - totalFoliosConsumed

  // Estadísticas de facturas por estado
  const invoicesByStatus = await prisma.invoice.groupBy({
    by: ["status"],
    _count: true,
  })

  // Top organizaciones por número de facturas
  const topOrgsByInvoices = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          invoices: true,
          users: true,
        },
      },
    },
    orderBy: {
      invoices: {
        _count: "desc",
      },
    },
    take: 5,
  })

  // Actividad por mes (últimos 6 meses)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const invoicesByMonth = await prisma.invoice.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: sixMonthsAgo,
      },
    },
    _count: true,
  })

  // Procesar datos para el gráfico de actividad
  const monthlyData = new Map<string, number>()
  invoicesByMonth.forEach((item) => {
    const month = new Date(item.createdAt).toISOString().slice(0, 7) // YYYY-MM
    monthlyData.set(month, (monthlyData.get(month) || 0) + item._count)
  })

  // Convertir a array para el gráfico
  const last6Months = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const month = date.toISOString().slice(0, 7)
    last6Months.push({
      month,
      count: monthlyData.get(month) || 0,
    })
  }

  // Ingresos totales (calculados a partir del precio de folios)
  const folioPools = await prisma.folioPool.findMany({
    select: {
      purchaseAmount: true,
    },
  })

  const estimatedRevenue = folioPools.reduce(
    (sum, pool) => sum + Number(pool.purchaseAmount),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Estadísticas del Sistema</h1>
        <p className="text-gray-600 mt-1">
          Vista general del rendimiento y uso de la plataforma
        </p>
      </div>

      {/* Métricas Principales */}
      <MetricsOverview
        metrics={{
          totalOrganizations,
          activeOrganizations,
          totalUsers,
          recentUsers,
          totalInvoices,
          recentInvoices,
          totalFoliosAssigned,
          totalFoliosConsumed,
          totalFoliosAvailable,
          estimatedRevenue,
        }}
      />

      {/* Grid de Estadísticas Detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estadísticas del Sistema */}
        <SystemStats
          invoicesByStatus={invoicesByStatus.map((item) => ({
            status: item.status,
            count: item._count,
          }))}
        />

        {/* Top Organizaciones */}
        <TopOrganizations
          organizations={topOrgsByInvoices.map((org) => ({
            id: org.id,
            name: org.name,
            invoices: org._count.invoices,
            users: org._count.users,
          }))}
        />
      </div>

      {/* Gráfico de Actividad */}
      <ActivityChart
        data={last6Months.map((item) => ({
          month: item.month,
          invoices: item.count,
        }))}
      />
    </div>
  )
}

