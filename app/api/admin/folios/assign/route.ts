import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { organizationId, userId, quantity, price, notes } = body

    // Validar campos
    if (!organizationId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    // Verificar que la organización existe
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      )
    }

    // Verificar que el usuario existe si se proporcionó
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        )
      }
    }

    // Crear los folios
    const folios = []
    for (let i = 0; i < quantity; i++) {
      folios.push({
        organizationId,
        userId: userId || null,
        status: "AVAILABLE",
        purchasePrice: price || 0.06,
        purchasedAt: new Date(),
      })
    }

    // Insertar en batch
    await prisma.folio.createMany({
      data: folios,
    })

    // TODO: Crear registro en AuditLog
    // TODO: Crear notificación para la organización

    return NextResponse.json({
      success: true,
      message: `${quantity} folios asignados correctamente`,
      data: {
        quantity,
        organizationId,
        userId,
        totalCost: (price || 0.06) * quantity,
      },
    })
  } catch (error) {
    console.error("Error al asignar folios:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

