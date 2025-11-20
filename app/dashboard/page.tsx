import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { FoliosWidget } from "@/app/dashboard/components/FoliosWidget"
import { EmissionHistory } from "@/app/dashboard/components/EmissionHistory"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { PlusCircle, Users, FileText, Settings } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
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

  // Obtener últimas facturas para el componente RecentInvoices
  const ultimasFacturas = await prisma.invoice.findMany({
    where: {
      organizationId,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header con Bienvenida y Acciones Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Inicio
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Bienvenido de vuelta, <span className="font-medium text-gray-900 dark:text-gray-200">{session.user.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/facturacion/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <PlusCircle className="w-5 h-5" />
            Nueva Factura
          </Link>
        </div>
      </div>

      {/* Widgets Principales HKA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Estado de Folios (Prioridad Alta) */}
        <div className="lg:col-span-1 space-y-6">
          <FoliosWidget />

          {/* Accesos Directos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider text-xs">
              Accesos Directos
            </h3>
            <div className="space-y-2">
              <Link href="/dashboard/clientes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Clientes</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestionar directorio</p>
                </div>
              </Link>

              <Link href="/dashboard/facturas" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Facturas</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Historial completo</p>
                </div>
              </Link>

              <Link href="/dashboard/configuracion" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Configuración</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ajustes de HKA</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Historial y Actividad */}
        <div className="lg:col-span-2 space-y-6">
          {/* Historial de Emisiones HKA */}
          <EmissionHistory />

          {/* Últimas Facturas (Legacy/Local) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Últimas Facturas Registradas
              </h3>
              <Link href="/dashboard/facturas" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Ver todas
              </Link>
            </div>
            <div className="p-0">
              <RecentInvoices invoices={ultimasFacturas} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}