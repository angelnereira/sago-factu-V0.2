import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"

/**
 * Página de detalle de factura para usuarios SIMPLE
 * Permite ver facturas certificadas con todos los datos de respuesta HKA
 */
export default async function SimpleInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/")
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

  // Obtener factura con todos los detalles incluyendo campos de respuesta HKA
  // Mismo query que en dashboard para consistencia
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      organizationId, // Asegurar que pertenece a la organización
    },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      cufe: true,
      cafe: true,
      numeroDocumentoFiscal: true,
      qrUrl: true,
      qrCode: true,
      hkaProtocol: true,
      hkaProtocolDate: true,
      hkaResponseMessage: true,
      certifiedAt: true,
      createdAt: true,
      issueDate: true,
      clientReferenceId: true,
      currency: true,
      subtotal: true,
      discount: true,
      itbms: true,
      total: true,
      notes: true,
      issuerRuc: true,
      issuerDv: true,
      issuerName: true,
      issuerAddress: true,
      issuerEmail: true,
      receiverName: true,
      receiverRuc: true,
      receiverDv: true,
      receiverAddress: true,
      receiverEmail: true,
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

