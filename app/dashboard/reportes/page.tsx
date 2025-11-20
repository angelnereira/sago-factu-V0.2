import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { SalesReport } from "@/components/reports/sales-report"
import { EmissionHistory } from "@/app/dashboard/components/EmissionHistory"
import { Download, FileText, TrendingUp, Package } from "lucide-react"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { es } from "date-fns/locale"
import { checkFolios } from "@/app/actions/hka/check-folios.action"

export default async function ReportsPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-800 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
            Sin Organización Asignada
          </h2>
          <p className="text-red-600 dark:text-red-300">
            Tu usuario no tiene una organización configurada. Contacta al administrador del sistema.
          </p>
        </div>
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

  // Obtener estado real de folios desde HKA (Server Action)
  // Nota: En un componente de servidor async, podemos llamar a la lógica de la acción directamente si fuera necesario,
  // pero aquí usaremos un valor por defecto o intentaremos obtenerlo si es posible, 
  // o dejaremos que el widget de cliente lo maneje. Para el reporte estático, usaremos datos locales si existen o 0.
  // Para simplificar y evitar latencia en carga de página, mostraremos "--" si no tenemos el dato cached.

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Reportes y Analítica</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visión completa del rendimiento de tu facturación
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm">
          <Download className="h-5 w-5" />
          <span>Exportar Excel</span>
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas del mes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-lg ${salesChange >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {salesChange >= 0 ? '+' : ''}{salesChange.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ventas del Mes</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            ${currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            vs ${lastTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mes pasado
          </p>
        </div>

        {/* Facturas emitidas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-lg ${invoicesChange >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {invoicesChange >= 0 ? '+' : ''}{invoicesChange.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Facturas Emitidas</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {currentMonthStats._count}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            vs {lastMonthStats._count} mes pasado
          </p>
        </div>

        {/* Promedio por factura */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Promedio</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            ${currentMonthStats._count > 0
              ? (currentTotal / currentMonthStats._count).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "0.00"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            En {currentMonthStats._count} facturas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reporte de ventas (Gráfica) */}
        <div className="lg:col-span-2">
          <SalesReport data={monthlyData} />
        </div>

        {/* Historial de Emisiones HKA */}
        <div className="lg:col-span-1">
          <EmissionHistory />
        </div>
      </div>
    </div>
  )
}

