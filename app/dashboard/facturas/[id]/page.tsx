import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const { id } = await params
  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  // Obtener factura con todos los detalles
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      organizationId, // Asegurar que pertenece a la organización
    },
    include: {
      items: {
        orderBy: {
          lineNumber: "asc",
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!invoice) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <InvoiceDetail invoice={invoice} organizationId={organizationId} />
    </div>
  )
}

