import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Solo SUPER_ADMIN puede cambiar estado de organizaciones
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      )
    }

    const { orgId } = await params
    const body = await request.json()
    const { isActive } = body

    // Verificar que la organización existe
    const orgToUpdate = await prisma.organization.findUnique({
      where: { id: orgId },
    })

    if (!orgToUpdate) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      )
    }

    // Actualizar estado
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        isActive: isActive,
        updatedAt: new Date(),
      },
    })

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        action: isActive ? "ORGANIZATION_ACTIVATE" : "ORGANIZATION_DEACTIVATE",
        entity: "Organization",
        entityId: orgId,
        changes: JSON.stringify({
          name: orgToUpdate.name,
          isActive: isActive,
        }),
        ip: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedOrg,
    })
  } catch (error) {
    console.error("[API] Error al cambiar estado de organización:", error)
    return NextResponse.json(
      { error: "Error al cambiar estado de organización" },
      { status: 500 }
    )
  }
}

