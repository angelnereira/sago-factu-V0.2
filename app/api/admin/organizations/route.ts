import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Solo SUPER_ADMIN puede crear organizaciones
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, ruc, dv, address, phone, email, website, logo, isActive } = body

    // Validar campos requeridos
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la organización es requerido" },
        { status: 400 }
      )
    }

    // Verificar si ya existe una organización con el mismo nombre
    const existingOrg = await prisma.organization.findFirst({
      where: { name: name.trim() },
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "Ya existe una organización con ese nombre" },
        { status: 400 }
      )
    }

    // Verificar si ya existe una organización con el mismo RUC (si se proporciona)
    if (ruc && ruc.trim() !== "") {
      const existingRuc = await prisma.organization.findFirst({
        where: { ruc: ruc.trim() },
      })

      if (existingRuc) {
        return NextResponse.json(
          { error: "Ya existe una organización con ese RUC" },
          { status: 400 }
        )
      }
    }

    // Generar slug único a partir del nombre
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    
    let slug = baseSlug
    let counter = 1
    
    // Verificar que el slug sea único
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Crear organización
    const organization = await prisma.organization.create({
      data: {
        id: nanoid(),
        slug,
        name: name.trim(),
        ruc: ruc?.trim() || null,
        dv: dv?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        logo: logo?.trim() || null,
        isActive: isActive ?? true,
      },
    })

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        action: "ORGANIZATION_CREATE",
        entity: "Organization",
        entityId: organization.id,
        changes: JSON.stringify({
          name: organization.name,
          ruc: organization.ruc,
        }),
        ip: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Organización creada correctamente",
      organization,
    })
  } catch (error) {
    console.error("[API] Error al crear organización:", error)
    return NextResponse.json(
      { error: "Error al crear organización" },
      { status: 500 }
    )
  }
}

