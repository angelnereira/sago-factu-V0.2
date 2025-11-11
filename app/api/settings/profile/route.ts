import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"

const updateSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  phone: z
    .string()
    .max(30, "El teléfono no puede superar 30 caracteres")
    .optional()
    .nullable(),
  language: z
    .string()
    .min(2)
    .max(10)
    .optional()
    .default("es"),
  timezone: z
    .string()
    .min(2)
    .max(60)
    .optional()
    .default("America/Panama"),
  emailNotifications: z.boolean().optional().default(true),
})

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        language: true,
        timezone: true,
        emailNotifications: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      profile: user,
    })
  } catch (error) {
    console.error("[API] Error obteniendo perfil de usuario:", error)
    return NextResponse.json(
      { error: "No se pudo obtener el perfil del usuario" },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        language: true,
        timezone: true,
        emailNotifications: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phone: data.phone ?? null,
        language: data.language ?? currentUser.language,
        timezone: data.timezone ?? currentUser.timezone,
        emailNotifications:
          typeof data.emailNotifications === "boolean"
            ? data.emailNotifications
            : currentUser.emailNotifications,
      },
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

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email ?? undefined,
        action: "PROFILE_UPDATE",
        entity: "User",
        entityId: session.user.id,
        changes: JSON.stringify({
          before: currentUser,
          after: {
            name: updatedUser.name,
            phone: updatedUser.phone,
            language: updatedUser.language,
            timezone: updatedUser.timezone,
            emailNotifications: updatedUser.emailNotifications,
          },
        }),
        ip: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    })

    return NextResponse.json({
      success: true,
      profile: updatedUser,
      message: "Perfil actualizado correctamente",
    })
  } catch (error) {
    console.error("[API] Error actualizando perfil de usuario:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: "No se pudo actualizar el perfil del usuario" },
      { status: 500 },
    )
  }
}

