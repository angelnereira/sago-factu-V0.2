import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"

async function getCertificateOrThrow(id: string, organizationId: string) {
  const certificate = await prisma.digitalCertificate.findFirst({
    where: { id, organizationId },
  })

  if (!certificate) {
    throw new Response(JSON.stringify({ error: "Certificado no encontrado" }), { status: 404 })
  }

  return certificate
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = params
    const certificate = await getCertificateOrThrow(id, session.user.organizationId)

    return NextResponse.json({
      id: certificate.id,
      ruc: certificate.ruc,
      issuer: certificate.issuer,
      subject: certificate.subject,
      serialNumber: certificate.serialNumber,
      validFrom: certificate.validFrom,
      validTo: certificate.validTo,
      uploadedAt: certificate.uploadedAt,
      lastUsedAt: certificate.lastUsedAt,
      isActive: certificate.isActive,
      certificateThumbprint: certificate.certificateThumbprint,
    })
  } catch (error) {
    if (error instanceof Response) {
      return error
    }

    console.error("[API] Error obteniendo certificado:", error)
    return NextResponse.json(
      { error: "Error al obtener el certificado" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json().catch(() => ({}))
    const { isActive } = body as { isActive?: boolean }

    await getCertificateOrThrow(id, session.user.organizationId)

    if (typeof isActive === "boolean") {
      if (isActive) {
        await prisma.digitalCertificate.updateMany({
          where: {
            organizationId: session.user.organizationId,
            isActive: true,
            id: { not: id },
          },
          data: { isActive: false },
        })
      }

      await prisma.digitalCertificate.update({
        where: { id },
        data: { isActive },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) {
      return error
    }

    console.error("[API] Error actualizando certificado:", error)
    return NextResponse.json(
      { error: "Error al actualizar el certificado" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = params

    await getCertificateOrThrow(id, session.user.organizationId)

    await prisma.digitalCertificate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) {
      return error
    }

    console.error("[API] Error eliminando certificado:", error)
    return NextResponse.json(
      { error: "Error al eliminar el certificado" },
      { status: 500 },
    )
  }
}


