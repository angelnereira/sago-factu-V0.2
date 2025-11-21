import { FileText, Eye, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Invoice {
  id: string
  invoiceNumber: string | null
  total: any
  status: string
  createdAt: Date
}

interface RecentInvoicesProps {
  invoices: Invoice[]
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'CERTIFIED':
    case 'EMITTED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Emitida
        </span>
      )
    case 'ERROR':
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-3 h-3 mr-1" /> Error
        </span>
      )
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Procesando
        </span>
      )
    case 'QUEUED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
          <Clock className="w-3 h-3 mr-1" /> En Cola
        </span>
      )
    default: // DRAFT
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <Clock className="w-3 h-3 mr-1" /> Borrador
        </span>
      )
  }
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header removed as it is handled by parent in dashboard page, or we can keep it if needed. 
          The previous code had a header inside the component. I will keep it but cleaner. */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Facturas Recientes
        </h3>
        <Link href="/dashboard/facturas" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Ver todas
        </Link>
      </div>

      <div className="p-0">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay facturas recientes</p>
            <Link
              href="/dashboard/facturacion/nueva"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Crear primera factura
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {invoice.invoiceNumber || "Sin número"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {getStatusBadge(invoice.status)}

                  <div className="text-right min-w-[80px]">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      ${Number(invoice.total).toFixed(2)}
                    </p>
                  </div>

                  <Link href={`/dashboard/facturas/${invoice.id}`}>
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

