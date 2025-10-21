import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: "Usuario sin organización asignada" },
        { status: 400 }
      )
    }

    // Obtener folios disponibles (asignados - consumidos)
    const folioAssignments = await prisma.folioAssignment.findMany({
      where: { organizationId },
      include: {
        folioPool: {
          select: {
            folioStart: true,
            folioEnd: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
      take: 100,
    })

    // Calcular disponibles
    const availableFolios = folioAssignments.map(fa => ({
      id: fa.id,
      poolRange: `${fa.folioPool.folioStart}-${fa.folioPool.folioEnd}`,
      assignedAmount: fa.assignedAmount,
      consumedAmount: fa.consumedAmount,
      available: fa.assignedAmount - fa.consumedAmount,
    }))

    const totalAvailable = availableFolios.reduce((sum, fa) => sum + fa.available, 0)

    return NextResponse.json({
      success: true,
      data: {
        folios: availableFolios,
        total: totalAvailable,
      },
    })
  } catch (error) {
    console.error("[API] Error al consultar folios disponibles:", error)
    return NextResponse.json(
      { error: "Error al consultar folios disponibles" },
      { status: 500 }
    )
  }
}

