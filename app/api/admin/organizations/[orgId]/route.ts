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

    // Solo SUPER_ADMIN puede actualizar organizaciones
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      )
    }

    const { orgId } = await params
    const body = await request.json()
    const { name, ruc, dv, address, phone, email, website, logo, isActive } = body

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

    // Verificar si el nuevo nombre ya existe (solo si cambió)
    if (name && name.trim() !== "" && name.trim() !== orgToUpdate.name) {
      const existingName = await prisma.organization.findFirst({
        where: {
          name: name.trim(),
          id: { not: orgId },
        },
      })

      if (existingName) {
        return NextResponse.json(
          { error: "Ya existe una organización con ese nombre" },
          { status: 400 }
        )
      }
    }

    // Verificar si el nuevo RUC ya existe (solo si cambió y no es vacío)
    if (ruc && ruc.trim() !== "" && ruc.trim() !== orgToUpdate.ruc) {
      const existingRuc = await prisma.organization.findFirst({
        where: {
          ruc: ruc.trim(),
          id: { not: orgId },
        },
      })

      if (existingRuc) {
        return NextResponse.json(
          { error: "Ya existe una organización con ese RUC" },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (ruc !== undefined) updateData.ruc = ruc?.trim() || null
    if (dv !== undefined) updateData.dv = dv?.trim() || null
    if (address !== undefined) updateData.address = address?.trim() || null
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (email !== undefined) updateData.email = email?.trim() || null
    if (website !== undefined) updateData.website = website?.trim() || null
    if (logo !== undefined) updateData.logo = logo?.trim() || null
    if (isActive !== undefined) updateData.isActive = isActive

    // Actualizar organización
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: updateData,
    })

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        action: "ORGANIZATION_UPDATE",
        entity: "Organization",
        entityId: orgId,
        changes: JSON.stringify({
          before: {
            name: orgToUpdate.name,
            ruc: orgToUpdate.ruc,
            isActive: orgToUpdate.isActive,
          },
          after: updateData,
        }),
        ip: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Organización actualizada correctamente",
      organization: updatedOrg,
    })
  } catch (error) {
    console.error("[API] Error al actualizar organización:", error)
    return NextResponse.json(
      { error: "Error al actualizar organización" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Solo SUPER_ADMIN puede eliminar organizaciones
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      )
    }

    const { orgId } = await params

    // Verificar que la organización existe
    const orgToDelete = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            users: true,
            invoices: true,
          },
        },
      },
    })

    if (!orgToDelete) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      )
    }

    // Advertencia si tiene usuarios o facturas
    if (orgToDelete._count.users > 0 || orgToDelete._count.invoices > 0) {
      // Eliminar en cascada
      // 1. Obtener usuarios de la organización para eliminar notificaciones
      const orgUsers = await prisma.user.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })
      const userIds = orgUsers.map(u => u.id)
      
      if (userIds.length > 0) {
        await prisma.notification.deleteMany({
          where: { userId: { in: userIds } },
        })
      }

      // 2. Eliminar items de facturas
      await prisma.invoiceItem.deleteMany({
        where: {
          invoice: {
            organizationId: orgId,
          },
        },
      })

      // 3. Eliminar logs de facturas
      await prisma.invoiceLog.deleteMany({
        where: {
          invoice: {
            organizationId: orgId,
          },
        },
      })

      // 4. Eliminar facturas
      await prisma.invoice.deleteMany({
        where: { organizationId: orgId },
      })

      // 5. Eliminar asignaciones de folios
      await prisma.folioAssignment.deleteMany({
        where: { organizationId: orgId },
      })

      // 6. Eliminar API Keys
      await prisma.apiKey.deleteMany({
        where: { organizationId: orgId },
      })

      // 7. Eliminar configuraciones del sistema
      await prisma.systemConfig.deleteMany({
        where: { organizationId: orgId },
      })

      // 8. Eliminar usuarios (esto activará CASCADE en las relaciones)
      await prisma.user.deleteMany({
        where: { organizationId: orgId },
      })
    }

    // Eliminar organización
    await prisma.organization.delete({
      where: { id: orgId },
    })

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        action: "ORGANIZATION_DELETE",
        entity: "Organization",
        entityId: orgId,
        changes: JSON.stringify({
          deletedOrg: orgToDelete.name,
          usersDeleted: orgToDelete._count.users,
          invoicesDeleted: orgToDelete._count.invoices,
        }),
        ip: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Organización eliminada correctamente",
    })
  } catch (error) {
    console.error("[API] Error al eliminar organización:", error)
    return NextResponse.json(
      { error: "Error al eliminar organización" },
      { status: 500 }
    )
  }
}

