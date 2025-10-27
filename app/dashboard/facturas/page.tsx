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
      },
    }),
    prisma.invoice.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

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
        invoices={invoices}
        currentPage={page}
        totalPages={totalPages}
        currentStatus={status}
      />
    </div>
  )
}

