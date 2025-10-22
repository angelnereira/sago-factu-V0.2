import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { SalesReport } from "@/components/reports/sales-report"
import { FolioReport } from "@/components/reports/folio-report"
import { Download, FileText, TrendingUp, Package } from "lucide-react"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { es } from "date-fns/locale"

export default async function ReportsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  // Obtener fechas para el reporte
  const today = new Date()
  const currentMonthStart = startOfMonth(today)
  const currentMonthEnd = endOfMonth(today)
  const lastMonthStart = startOfMonth(subMonths(today, 1))
  const lastMonthEnd = endOfMonth(subMonths(today, 1))

  // Estadísticas del mes actual
  const currentMonthStats = await prisma.invoice.aggregate({
    where: {
      organizationId,
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd,
      },
    },
    _sum: {
      total: true,
    },
    _count: true,
  })

  // Estadísticas del mes pasado
  const lastMonthStats = await prisma.invoice.aggregate({
    where: {
      organizationId,
      createdAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
    _sum: {
      total: true,
    },
    _count: true,
  })

  // Estadísticas de folios
  const folioAssignments = await prisma.folioAssignment.findMany({
    where: { organizationId },
    select: {
      assignedAmount: true,
      consumedAmount: true,
    },
  })

  const totalFolios = folioAssignments.reduce((sum, fa) => sum + fa.assignedAmount, 0)
  const foliosUsados = folioAssignments.reduce((sum, fa) => sum + fa.consumedAmount, 0)
  const foliosDisponibles = totalFolios - foliosUsados

  // Calcular cambio porcentual
  const currentTotal = parseFloat(currentMonthStats._sum.total?.toString() || "0")
  const lastTotal = parseFloat(lastMonthStats._sum.total?.toString() || "0")
  
  const salesChange = lastTotal > 0
    ? ((currentTotal - lastTotal) / lastTotal) * 100
    : 0

  const invoicesChange = lastMonthStats._count > 0
    ? ((currentMonthStats._count - lastMonthStats._count) / lastMonthStats._count) * 100
    : 0

  // Obtener datos para gráficas (últimos 6 meses)
  const sixMonthsAgo = subMonths(today, 5)
  const monthlyData = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const monthDate = subMonths(today, 5 - i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      const monthStats = await prisma.invoice.aggregate({
        where: {
          organizationId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          total: true,
        },
        _count: true,
      })

      return {
        month: format(monthDate, "MMM yyyy", { locale: es }),
        ventas: parseFloat(monthStats._sum.total?.toString() || "0"),
        facturas: monthStats._count,
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-2">
            Analiza el rendimiento de tu negocio
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Download className="h-5 w-5" />
          <span>Exportar Reporte</span>
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas del mes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className={`text-sm font-medium ${salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {salesChange >= 0 ? '+' : ''}{salesChange.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Ventas del Mes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ${currentTotal.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            vs ${lastTotal.toFixed(2)} mes pasado
          </p>
        </div>

        {/* Facturas emitidas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <span className={`text-sm font-medium ${invoicesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {invoicesChange >= 0 ? '+' : ''}{invoicesChange.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Facturas Emitidas</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {currentMonthStats._count}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            vs {lastMonthStats._count} mes pasado
          </p>
        </div>

        {/* Folios disponibles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {foliosDisponibles > 0 ? Math.round((foliosDisponibles / totalFolios) * 100) : 0}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Folios Disponibles</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {foliosDisponibles}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            de {totalFolios} totales
          </p>
        </div>

        {/* Promedio por factura */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Promedio por Factura</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ${currentMonthStats._count > 0 
              ? (currentTotal / currentMonthStats._count).toFixed(2)
              : "0.00"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            En {currentMonthStats._count} facturas
          </p>
        </div>
      </div>

      {/* Reporte de ventas */}
      <SalesReport data={monthlyData} />

      {/* Reporte de folios */}
      <FolioReport 
        total={totalFolios}
        disponibles={foliosDisponibles}
        usados={foliosUsados}
      />
    </div>
  )
}

