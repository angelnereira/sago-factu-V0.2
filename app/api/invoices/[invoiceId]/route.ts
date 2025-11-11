import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"

const NON_DELETABLE_STATUSES = new Set(["PROCESSING", "CERTIFIED", "QUEUED"])

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ invoiceId: string }>
  },
) {
  const session = await auth()

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { invoiceId } = await params

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        organizationId: true,
        createdBy: true,
        status: true,
        invoiceNumber: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    const { role, organizationId: userOrganizationId, id: userId, email } = session.user

    const isSuperAdmin = role === "SUPER_ADMIN"
    const isOrgAdmin = role === "ORG_ADMIN"
    const isOwner = invoice.createdBy === userId

    if (!isSuperAdmin) {
      if (!invoice.organizationId || invoice.organizationId !== userOrganizationId) {
        return NextResponse.json(
          { error: "No tienes permisos para eliminar facturas de otra organización" },
          { status: 403 },
        )
      }
    }

    if (!isSuperAdmin && !isOrgAdmin && !isOwner) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar esta factura" },
        { status: 403 },
      )
    }

    if (invoice.status && NON_DELETABLE_STATUSES.has(invoice.status)) {
      return NextResponse.json(
        {
          error:
            "La factura no se puede eliminar porque está en proceso o ya fue certificada. Anúlala en su lugar.",
        },
        { status: 400 },
      )
    }

    await prisma.invoiceLog.create({
      data: {
        invoiceId: invoice.id,
        action: "MANUAL_INTERVENTION",
        message: `Factura eliminada manualmente por ${email ?? "usuario sin email"}`,
        userId,
        userEmail: email ?? undefined,
        metadata: {
          statusBeforeDeletion: invoice.status,
        },
      },
    })

    await prisma.invoice.delete({
      where: { id: invoice.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error eliminando factura:", error)
    return NextResponse.json(
      { error: "Error al eliminar la factura. Intenta nuevamente o contacta al administrador." },
      { status: 500 },
    )
  }
}

