import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ConfigurationTabs } from "@/components/configuration/configuration-tabs"
import { prismaServer as prisma } from "@/lib/prisma-server"

export default async function ConfigurationPage() {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/auth/signin")
  }

  // Solo SUPER_ADMIN y ADMIN pueden acceder a configuración
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  // Obtener datos de la organización
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Organización no encontrada</p>
      </div>
    )
  }

  // Obtener usuarios de la organización
  const users = await prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  })

  // Obtener configuraciones del sistema (si existen)
  const systemConfig = await prisma.systemConfig.findFirst({
    where: { organizationId },
  })

  // Obtener estadísticas de folios
  const folioStats = await prisma.folioAssignment.aggregate({
    where: { organizationId },
    _sum: {
      assignedAmount: true,
      consumedAmount: true,
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu organización, usuarios y preferencias del sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
            {session.user.role}
          </span>
        </div>
      </div>

      {/* Tabs de Configuración */}
      <ConfigurationTabs
        organization={organization}
        users={users}
        systemConfig={systemConfig}
        folioStats={{
          totalAssigned: folioStats._sum.assignedAmount || 0,
          totalConsumed: folioStats._sum.consumedAmount || 0,
        }}
        userRole={session.user.role as string}
        userId={session.user.id}
      />
    </div>
  )
}

