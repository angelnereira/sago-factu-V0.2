import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { InvoiceList } from "@/components/invoices/invoice-list"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    page?: string
  }>
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/")
  }

  const organizationId = session.user.organizationId
  const userRole = session.user.role as string
  const userId = session.user.id

  const privilegedRoles = new Set(["SUPER_ADMIN", "ORG_ADMIN"])
  const canViewAllFromOrganization = privilegedRoles.has(userRole)

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  const params = await searchParams
  const status = params.status
  const page = parseInt(params.page || "1")
  const perPage = 20

  // Construir filtros
  const where: any = { organizationId }
  if (!canViewAllFromOrganization) {
    where.createdBy = userId
  }
  if (status && status !== "ALL") {
    where.status = status
  }

  // Obtener facturas
  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        invoiceNumber: true,
        receiverName: true,
        receiverRuc: true,
        total: true,
        status: true,
        createdAt: true,
        issueDate: true,
        createdBy: true,
        pdfBase64: true,
        pdfUrl: true,
        rawXml: true,
        xmlContent: true,
      },
    }),
    prisma.invoice.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  const serializedInvoices = invoices.map((invoice) => {
    const total =
      typeof invoice.total === "number"
        ? invoice.total
        : typeof invoice.total === "string"
          ? Number(invoice.total)
          : Number(invoice.total?.toString?.() ?? 0)

    const canDelete =
      privilegedRoles.has(userRole) || invoice.createdBy === userId

    const hasPdf = Boolean(invoice.pdfUrl || invoice.pdfBase64)
    const hasXml = Boolean(invoice.rawXml || invoice.xmlContent)

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      receiverName: invoice.receiverName,
      receiverRuc: invoice.receiverRuc,
      total,
      status: invoice.status,
      createdAt: invoice.createdAt.toISOString(),
      issueDate: invoice.issueDate ? invoice.issueDate.toISOString() : null,
      canDelete,
      hasPdf,
      hasXml,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Facturas</h1>
          <p className="text-gray-600 mt-2">
            Gestiona y consulta todas las facturas emitidas
          </p>
        </div>
        <Link
          href="/dashboard/facturas/nueva"
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Factura</span>
        </Link>
      </div>

      {/* Lista de facturas */}
      <InvoiceList
        invoices={serializedInvoices}
        currentPage={page}
        totalPages={totalPages}
        currentStatus={status}
      />
    </div>
  )
}

