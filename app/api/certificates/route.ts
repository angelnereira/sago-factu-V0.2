import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { storeCertificate, listCertificates } from "@/lib/certificates/storage"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const requestedOrganizationId = url.searchParams.get("organizationId")

    const organizationId =
      requestedOrganizationId && session.user.role === "SUPER_ADMIN"
        ? requestedOrganizationId
        : session.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organización no especificada" },
        { status: 400 },
      )
    }

    const certificates = await listCertificates(organizationId)

    return NextResponse.json(certificates)
  } catch (error) {
    console.error("[API] Error obteniendo certificados:", error)
    return NextResponse.json(
      { error: "Error al obtener certificados" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("certificate")
    const pin = formData.get("pin")
    const requestedOrganizationId = formData.get("organizationId") as string | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Archivo de certificado requerido" }, { status: 400 })
    }

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN del certificado requerido" }, { status: 400 })
    }

    if (!file.name.match(/\.(p12|pfx)$/i)) {
      return NextResponse.json({ error: "Formato inválido. Seleccione un archivo .p12 o .pfx" }, { status: 400 })
    }

    const organizationId =
      requestedOrganizationId && session.user.role === "SUPER_ADMIN"
        ? requestedOrganizationId
        : session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organización no especificada" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Usuario sin organización asociada" }, { status: 400 })
    }

    if (
      session.user.role !== "SUPER_ADMIN" &&
      user.organization &&
      user.organization.id !== organizationId
    ) {
      return NextResponse.json(
        { error: "No autorizado para administrar certificados de esta organización" },
        { status: 403 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const certificateId = await storeCertificate({
      tenantId: organizationId,
      p12File: buffer,
      pin,
      uploadedBy: session.user.id,
    })

    return NextResponse.json({ success: true, certificateId })
  } catch (error) {
    console.error("[API] Error subiendo certificado:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar el certificado" },
      { status: 500 },
    )
  }
}


