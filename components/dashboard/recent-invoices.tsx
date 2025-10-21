import { FileText, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Invoice {
  id: string
  invoiceNumber: string | null
  total: any // Decimal from Prisma
  status: string
  createdAt: Date
}

interface RecentInvoicesProps {
  invoices: Invoice[]
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
}

const statusLabels = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Facturas Recientes</h2>
          <p className="text-sm text-gray-600 mt-1">Últimas 5 facturas emitidas</p>
        </div>
        <Link
          href="/dashboard/facturas"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Ver todas
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay facturas recientes</p>
          <Link
            href="/dashboard/facturas/nueva"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Crear primera factura
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center h-10 w-10 bg-indigo-100 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber || "Sin número"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[invoice.status as keyof typeof statusColors] ||
                    statusColors.DRAFT
                  }`}
                >
                  {statusLabels[invoice.status as keyof typeof statusLabels] || invoice.status}
                </span>
                <p className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                  ${typeof invoice.total === 'number' ? invoice.total.toFixed(2) : '0.00'}
                </p>
                <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

