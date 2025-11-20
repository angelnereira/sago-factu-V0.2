import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { MetricsCard } from "@/components/dashboard/metrics-card"
import { FolioChart } from "@/components/dashboard/folio-chart"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { FoliosWidget } from "@/app/dashboard/components/FoliosWidget"
import { EmissionHistory } from "@/app/dashboard/components/EmissionHistory"
import { FileText, Folder, TrendingUp, Users } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  // Obtener métricas desde la base de datos
  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  // Contar folios disponibles (asignados - consumidos)
  const folioAssignments = await prisma.folioAssignment.findMany({
    where: { organizationId },
    select: {
      assignedAmount: true,
      consumedAmount: true,
    },
  })

  const foliosDisponibles = folioAssignments.reduce((sum, fa) =>
    sum + (fa.assignedAmount - fa.consumedAmount), 0
  )

  // Contar facturas del mes actual
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const facturasDelMes = await prisma.invoice.count({
    where: {
      organizationId,
      createdAt: {
        gte: startOfMonth,
      },
    },
  })

  // Contar total de facturas
  const totalFacturas = await prisma.invoice.count({
    where: {
      organizationId,
    },
  })

  // Obtener últimas facturas
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
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          ¡Bienvenido, {session.user.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Resumen de tu actividad en SAGO-FACTU
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Folios Disponibles"
          value={foliosDisponibles}
          icon={Folder}
          trend={0}
          color="blue"
        />
        <MetricsCard
          title="Facturas del Mes"
          value={facturasDelMes}
          icon={FileText}
          trend={0}
          color="green"
        />
        <MetricsCard
          title="Total Facturas"
          value={totalFacturas}
          icon={TrendingUp}
          trend={0}
          color="purple"
        />
        <MetricsCard
          title="Usuarios Activos"
          value={1}
          icon={Users}
          trend={0}
          color="orange"
        />
      </div>

      {/* Widgets HKA v2.0 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FoliosWidget />
        <EmissionHistory />
      </div>

      {/* Gráfica y facturas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FolioChart organizationId={organizationId} />
        <RecentInvoices invoices={ultimasFacturas} />
      </div>
    </div>
  )
}