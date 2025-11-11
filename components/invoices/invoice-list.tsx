"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Download,
  Eye,
  FileDown,
  FileText,
  Search,
  Trash2,
} from "lucide-react"
import { formatPanamaDateShortMonth } from "@/lib/utils/date-timezone"

interface Invoice {
  id: string
  invoiceNumber: string | null
  receiverName: string
  receiverRuc: string | null
  total: number
  status: string
  createdAt: string
  issueDate: string | null
  canDelete: boolean
  hasPdf: boolean
  hasXml: boolean
}

interface InvoiceListProps {
  invoices: Invoice[]
  currentPage: number
  totalPages: number
  currentStatus?: string
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  QUEUED: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  CERTIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  ERROR: "bg-orange-100 text-orange-800",
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  QUEUED: "En cola",
  PROCESSING: "Procesando",
  CERTIFIED: "Certificada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
  ERROR: "Error",
}

type DownloadType = "pdf" | "xml"

export function InvoiceList({ invoices, currentPage, totalPages, currentStatus }: InvoiceListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadType, setDownloadType] = useState<DownloadType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Filtrar por estado
  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams)
    if (status === "ALL") {
      params.delete("status")
    } else {
      params.set("status", status)
    }
    params.delete("page")
    router.push(`/dashboard/facturas?${params.toString()}`)
  }

  // Cambiar página
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`/dashboard/facturas?${params.toString()}`)
  }

  // Filtrar localmente por término de búsqueda
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.receiverRuc?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDownload = async (invoiceId: string, type: DownloadType, fileNameHint: string | null) => {
    try {
      setStatusMessage(null)
      setDownloadingId(invoiceId)
      setDownloadType(type)

      const response = await fetch(`/api/invoices/${invoiceId}/${type}`, {
        method: "GET",
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const message =
          (errorPayload && (errorPayload.error || errorPayload.message)) ||
          `No se pudo descargar el ${type === "pdf" ? "PDF" : "XML"}`
        throw new Error(message)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      const extension = type === "pdf" ? "pdf" : "xml"
      const filename = fileNameHint
        ? `${fileNameHint}.${extension}`
        : `factura-${invoiceId}.${extension}`
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[InvoiceList] Error downloading file", error)
      setStatusMessage({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al intentar descargar el archivo",
      })
    } finally {
      setDownloadingId(null)
      setDownloadType(null)
    }
  }

  const handleDelete = async (invoiceId: string) => {
    const confirmMessage =
      "¿Seguro que deseas eliminar esta factura? Esta acción no se puede deshacer."
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setStatusMessage(null)
      setDeletingId(invoiceId)

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        const message = payload?.error || "No se pudo eliminar la factura"
        throw new Error(message)
      }

      setStatusMessage({
        type: "success",
        message: "Factura eliminada correctamente.",
      })
      router.refresh()
    } catch (error) {
      console.error("[InvoiceList] Error deleting invoice", error)
      setStatusMessage({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al eliminar la factura.",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            statusMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {statusMessage.message}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por número, cliente o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filtro por estado */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusFilter("ALL")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !currentStatus || currentStatus === "ALL"
                  ? "bg-indigo-600 dark:bg-indigo-700 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Todas
            </button>
            {Object.entries(statusLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleStatusFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentStatus === key
                    ? "bg-indigo-600 dark:bg-indigo-700 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay facturas para mostrar</p>
            <Link
              href="/dashboard/facturas/nueva"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Crear primera factura
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {invoice.invoiceNumber || "Sin número"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {invoice.receiverName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {invoice.receiverRuc}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatPanamaDateShortMonth(invoice.issueDate || invoice.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {invoice.total.toLocaleString("es-PA", {
                        style: "currency",
                        currency: "PAB",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[invoice.status as keyof typeof statusColors] ||
                          statusColors.DRAFT
                        }`}
                      >
                        {statusLabels[invoice.status as keyof typeof statusLabels] || invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/facturas/${invoice.id}`}
                          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {invoice.hasPdf && (
                          <button
                            onClick={() => handleDownload(invoice.id, "pdf", invoice.invoiceNumber)}
                            disabled={downloadingId === invoice.id}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Descargar factura (PDF)"
                          >
                            <Download
                              className={`h-4 w-4 ${
                                downloadingId === invoice.id && downloadType === "pdf" ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                        )}
                        {invoice.hasXml && (
                          <button
                            onClick={() => handleDownload(invoice.id, "xml", invoice.invoiceNumber)}
                            disabled={downloadingId === invoice.id}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Descargar documento DGI (XML)"
                          >
                            <FileDown
                              className={`h-4 w-4 ${
                                downloadingId === invoice.id && downloadType === "xml" ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                        )}
                        {invoice.canDelete && (
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar factura"
                          >
                            <Trash2 className={`h-4 w-4 ${deletingId === invoice.id ? "animate-spin" : ""}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

