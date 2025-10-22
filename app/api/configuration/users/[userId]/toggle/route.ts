import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Solo SUPER_ADMIN y ADMIN pueden cambiar el estado de usuarios
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await request.json()
    const { isActive } = body

    // No permitir cambiar el estado del propio usuario
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "No puedes cambiar el estado de tu propio usuario" },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe y pertenece a la misma organización
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToUpdate) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (userToUpdate.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: "No puedes modificar usuarios de otra organización" },
        { status: 403 }
      )
    }

    // Actualizar estado del usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
        action: isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE",
        entity: "User",
        entityId: userId,
        changes: JSON.stringify({
          email: userToUpdate.email,
          isActive: isActive,
        }),
        ip: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error("[API] Error al cambiar estado del usuario:", error)
    return NextResponse.json(
      { error: "Error al cambiar estado del usuario" },
      { status: 500 }
    )
  }
}

