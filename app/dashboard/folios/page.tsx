import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { FolioStats } from "@/components/folios/folio-stats"
import { FolioList } from "@/components/folios/folio-list"
import { FolioPurchaseButton } from "@/components/folios/folio-purchase-button"
import { Plus } from "lucide-react"

export default async function FoliosPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/")
  }

  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  // Obtener estadísticas de folios
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
  const foliosReservados = 0 // Por ahora no tenemos sistema de reservas

  // Obtener pools de folios (a través de las asignaciones)
  const folioAssignmentsWithPools = await prisma.folioAssignment.findMany({
    where: { organizationId },
    select: {
      folioPool: true,
    },
    orderBy: { assignedAt: "desc" },
    take: 10,
  })
  
  const folioPools = folioAssignmentsWithPools.map(fa => fa.folioPool)

  // Obtener asignaciones de folios con detalles
  const folioAssignmentsDetailed = await prisma.folioAssignment.findMany({
    where: { organizationId },
    orderBy: { assignedAt: "desc" },
    take: 20,
    include: {
      folioPool: true,
    },
  })

  // Obtener usuarios que asignaron (si assignedBy existe)
  const assignedByIds = folioAssignmentsDetailed
    .map(fa => fa.assignedBy)
    .filter((id): id is string => !!id)
  
  const users = assignedByIds.length > 0 ? await prisma.user.findMany({
    where: {
      id: { in: assignedByIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  }) : []

  const usersMap = new Map(users.map(u => [u.id, u]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Folios</h1>
          <p className="text-gray-600 mt-2">
            Administra y monitorea tus folios de facturación
          </p>
        </div>
        <FolioPurchaseButton />
      </div>

      {/* Estadísticas */}
      <FolioStats
        total={totalFolios}
        disponibles={foliosDisponibles}
        usados={foliosUsados}
        reservados={foliosReservados}
      />

      {/* Lista de folios */}
      <FolioList
        pools={folioPools}
        assignments={folioAssignmentsDetailed.map(fa => ({
          ...fa,
          user: fa.assignedBy ? usersMap.get(fa.assignedBy) : null,
        }))}
      />
    </div>
  )
}

