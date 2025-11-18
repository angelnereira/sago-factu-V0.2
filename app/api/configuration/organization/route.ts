import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Solo SUPER_ADMIN y ORG_ADMIN pueden actualizar configuración organizacional
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ORG_ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      )
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: "Usuario sin organización asignada" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, ruc, dv, address, phone, email, website } = body

    // Validaciones
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    if (!ruc || ruc.trim() === "") {
      return NextResponse.json(
        { error: "El RUC es requerido" },
        { status: 400 }
      )
    }

    // Actualizar organización
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: name.trim(),
        ruc: ruc.trim(),
        dv: dv?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        updatedAt: new Date(),
      },
    })

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        action: "ORGANIZATION_UPDATE",
        entity: "Organization",
        entityId: organizationId,
        changes: JSON.stringify({
          name,
          ruc,
          dv,
          address,
          phone,
          email,
          website,
        }),
        ip: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedOrganization,
    })
  } catch (error) {
    console.error("[API] Error al actualizar organización:", error)
    return NextResponse.json(
      { error: "Error al actualizar organización" },
      { status: 500 }
    )
  }
}

