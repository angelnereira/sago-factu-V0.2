import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ConfigurationTabs } from "@/components/configuration/configuration-tabs"
import { prismaServer as prisma } from "@/lib/prisma-server"

export default async function ConfigurationPage() {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/")
  }

  const organizationId = session.user.organizationId
  const userRole = session.user.role as string

  const isSuperAdmin = userRole === "SUPER_ADMIN"
  const isOrgAdmin = userRole === "ORG_ADMIN"
  const canManageOrganization = isSuperAdmin || isOrgAdmin

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

  let usersWithFolios: any[] = []
  let folioStats = {
    _sum: {
      assignedAmount: 0,
      consumedAmount: 0,
    },
  }
  let systemConfig: Awaited<ReturnType<typeof prisma.systemConfig.findFirst>> = null

  if (canManageOrganization) {
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
        invoices: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const folioAssignmentsByUser = await prisma.folioAssignment.groupBy({
      by: ["organizationId"],
      where: {
        organizationId: {
          in: users.map((user) => user.organizationId).filter(Boolean) as string[],
        },
      },
      _sum: {
        assignedAmount: true,
        consumedAmount: true,
      },
    })

    const foliosByOrg = new Map(
      folioAssignmentsByUser.map((item) => [
        item.organizationId,
        {
          assigned: item._sum.assignedAmount || 0,
          consumed: item._sum.consumedAmount || 0,
        },
      ]),
    )

    usersWithFolios = users.map((user) => ({
      ...user,
      folioStats: user.organizationId
        ? foliosByOrg.get(user.organizationId) || { assigned: 0, consumed: 0 }
        : { assigned: 0, consumed: 0 },
      invoiceCount: user.invoices.length,
    }))

    systemConfig = await prisma.systemConfig.findFirst({
      where: { organizationId: organization.id },
    })

    folioStats = await prisma.folioAssignment.aggregate({
      where: { organizationId: organization.id },
      _sum: {
        assignedAmount: true,
        consumedAmount: true,
      },
    })
  }

  const availableCertificates = canManageOrganization
    ? await prisma.digitalCertificate.findMany({
        where: {
          organizationId: organization.id,
          isActive: true,
        },
        orderBy: { uploadedAt: "desc" },
      })
    : []

  const userSignatureConfig = await prisma.userSignatureConfig.findUnique({
    where: { userId: session.user.id },
  })

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      language: true,
      timezone: true,
      emailNotifications: true,
    },
  })

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">No se pudo cargar tu perfil de usuario</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuración</h1>
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
        users={usersWithFolios}
        organizations={organizations}
        systemConfig={systemConfig}
        folioStats={{
          totalAssigned: folioStats._sum.assignedAmount || 0,
          totalConsumed: folioStats._sum.consumedAmount || 0,
        }}
        userRole={session.user.role as string}
        userId={session.user.id}
        currentUser={currentUser}
        isSuperAdmin={isSuperAdmin}
        initialCertificates={availableCertificates.map((certificate) => ({
          id: certificate.id,
          subject: certificate.subject,
          issuer: certificate.issuer,
          validFrom: certificate.validFrom.toISOString(),
          validTo: certificate.validTo.toISOString(),
          ruc: certificate.ruc,
        }))}
        signatureConfig={userSignatureConfig
          ? {
              signatureMode: userSignatureConfig.signatureMode,
              digitalCertificateId: userSignatureConfig.digitalCertificateId,
              autoSign: userSignatureConfig.autoSign,
              notifyOnExpiration: userSignatureConfig.notifyOnExpiration,
            }
          : null}
      />
    </div>
  )
}

