import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ConfigurationTabs } from "@/components/configuration/configuration-tabs"
import { CertificateManager } from "@/components/certificates/certificate-manager"
import { DigitalSignatureSettings } from "@/components/certificates/digital-signature-settings"
import { prismaServer as prisma } from "@/lib/prisma-server"

export default async function ConfigurationPage() {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/")
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
      invoices: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Obtener estadísticas de folios por usuario
  const userIds = users.map(u => u.id)
  const folioAssignmentsByUser = await prisma.folioAssignment.groupBy({
    by: ['organizationId'],
    where: {
      organizationId: {
        in: users.map(u => u.organizationId).filter(Boolean) as string[],
      },
    },
    _sum: {
      assignedAmount: true,
      consumedAmount: true,
    },
  })

  // Crear un mapa de folios por organización
  const foliosByOrg = new Map(
    folioAssignmentsByUser.map(item => [
      item.organizationId,
      {
        assigned: item._sum.assignedAmount || 0,
        consumed: item._sum.consumedAmount || 0,
      }
    ])
  )

  // Agregar estadísticas de folios a cada usuario
  const usersWithFolios = users.map(user => ({
    ...user,
    folioStats: user.organizationId ? foliosByOrg.get(user.organizationId) || { assigned: 0, consumed: 0 } : { assigned: 0, consumed: 0 },
    invoiceCount: user.invoices.length,
  }))

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

  const activeCertificate = organization
    ? await prisma.certificate.findFirst({
        where: {
          organizationId: organization.id,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : null

  const availableCertificates = organization
    ? await prisma.certificate.findMany({
        where: {
          organizationId: organization.id,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  const userSignatureConfig = await prisma.userSignatureConfig.findUnique({
    where: { userId: session.user.id },
  })

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
        isSuperAdmin={isSuperAdmin}
      />

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Firma electrónica</h2>
          <p className="text-sm text-gray-500 mt-1">
            Carga y gestiona el certificado digital utilizado para firmar las facturas electrónicas y define tus
            preferencias personales de firma.
          </p>
        </div>

        <div className="space-y-6">
          <CertificateManager
            organizationId={organization.id}
            currentCertificate={activeCertificate
              ? {
                  id: activeCertificate.id,
                  subject: activeCertificate.subject,
                  issuer: activeCertificate.issuer,
                  validFrom: activeCertificate.validFrom.toISOString(),
                  validUntil: activeCertificate.validUntil.toISOString(),
                  ruc: activeCertificate.ruc,
                  dv: activeCertificate.dv,
                }
              : null}
          />

          <DigitalSignatureSettings
            certificates={availableCertificates.map(certificate => ({
              id: certificate.id,
              subject: certificate.subject,
              issuer: certificate.issuer,
              validFrom: certificate.validFrom.toISOString(),
              validUntil: certificate.validUntil.toISOString(),
              ruc: certificate.ruc,
              dv: certificate.dv,
            }))}
            initialConfig={userSignatureConfig
              ? {
                  signatureMode: userSignatureConfig.signatureMode,
                  certificateId: userSignatureConfig.certificateId,
                  autoSign: userSignatureConfig.autoSign,
                  notifyOnExpiration: userSignatureConfig.notifyOnExpiration,
                }
              : null}
          />
        </div>
      </section>
    </div>
  )
}

