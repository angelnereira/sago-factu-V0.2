import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ConfigurationTabs } from "@/components/configuration/configuration-tabs"
import { prismaServer as prisma } from "@/lib/prisma-server"

export default async function ConfigurationPage() {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/auth/signin")
  }

  // Solo SUPER_ADMIN y ORG_ADMIN pueden acceder a configuración
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const isOrgAdmin = session.user.role === "ORG_ADMIN"

  if (!isSuperAdmin && !isOrgAdmin) {
    redirect("/dashboard")
  }

  const organizationId = session.user.organizationId

  // Si no es SUPER_ADMIN, necesita tener organización asignada
  if (!isSuperAdmin && !organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  // Obtener datos de la organización (o la primera si es SUPER_ADMIN sin org)
  let organization = null
  if (organizationId) {
    organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })
  } else if (isSuperAdmin) {
    organization = await prisma.organization.findFirst({
      orderBy: { createdAt: "desc" },
    })
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Organización no encontrada</p>
      </div>
    )
  }

  // Obtener todas las organizaciones (solo para SUPER_ADMIN)
  const organizations = isSuperAdmin
    ? await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          ruc: true,
        },
        orderBy: { name: "asc" },
      })
    : []

  // Obtener usuarios de la organización (o todos si es SUPER_ADMIN)
  const users = await prisma.user.findMany({
    where: isSuperAdmin ? {} : { organizationId: organization.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          ruc: true,
        },
      },
    },
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
        organizations={organizations}
        systemConfig={systemConfig}
        folioStats={{
          totalAssigned: folioStats._sum.assignedAmount || 0,
          totalConsumed: folioStats._sum.consumedAmount || 0,
        }}
        userRole={session.user.role as string}
        userId={session.user.id}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}

