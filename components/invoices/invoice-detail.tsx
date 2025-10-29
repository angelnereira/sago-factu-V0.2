"use client"

import { Download, Send, XCircle, CheckCircle, Clock, FileText, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useState } from "react"
import { SendEmailButton } from "./send-email-button"
import { EmailHistory } from "./email-history"

interface InvoiceDetailProps {
  invoice: any
  organizationId: string
}

const statusConfig = {
  DRAFT: {
    label: "Borrador",
    color: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
    icon: FileText,
  },
  PENDING: {
    label: "Pendiente",
    color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400",
    icon: Clock,
  },
  PROCESSING: {
    label: "Procesando",
    color: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
    icon: Clock,
  },
  CERTIFIED: {
    label: "Certificada",
    color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    icon: CheckCircle,
  },
  APPROVED: {
    label: "Aprobada",
    color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rechazada",
    color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelada",
    color: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
    icon: XCircle,
  },
}

export function InvoiceDetail({ invoice, organizationId }: InvoiceDetailProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.DRAFT
  const StatusIcon = status.icon

  const handleSendToHKA = async () => {
    setIsProcessing(true)
    try {
      // TODO: Implementar envío a HKA
      alert("Funcionalidad pendiente: Enviar a HKA")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // TODO: Implementar descarga de PDF
      alert("Funcionalidad pendiente: Descargar PDF")
    } catch (error) {
      console.error("Error al descargar PDF:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/facturas"
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Factura {invoice.invoiceNumber || "Sin número"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Creada el {format(new Date(invoice.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {invoice.status === "CERTIFIED" && (
            <>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>Descargar PDF</span>
              </button>
              <SendEmailButton 
                invoiceId={invoice.id} 
                defaultEmail={invoice.receiverEmail || undefined}
              />
            </>
          )}
          {invoice.status === "PENDING" && (
            <button
              onClick={handleSendToHKA}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              <span>{isProcessing ? "Enviando..." : "Enviar a HKA"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{status.label}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {invoice.cufe && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">CUFE (Código Único)</p>
            <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1">{invoice.cufe}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos del Emisor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Emisor</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.issuerName}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">RUC:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.issuerRuc}-{invoice.issuerDv}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Dirección:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.issuerAddress}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.issuerEmail}</span>
            </div>
          </div>
        </div>

        {/* Datos del Receptor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Receptor (Cliente)</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.receiverName}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">RUC:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {invoice.receiverRuc}{invoice.receiverDv && `-${invoice.receiverDv}`}
              </span>
            </div>
            {invoice.receiverAddress && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Dirección:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.receiverAddress}</span>
              </div>
            )}
            {invoice.receiverEmail && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.receiverEmail}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items de la Factura */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detalle de Items</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precio Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IVA</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoice.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.lineNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    {parseFloat(item.quantity.toString()).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    ${parseFloat(item.unitPrice.toString()).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    ${parseFloat(item.taxAmount.toString()).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                    ${parseFloat(item.total.toString()).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Totales</h2>
        
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Subtotal:</span>
            <span className="font-medium">${parseFloat(invoice.subtotal.toString()).toFixed(2)}</span>
          </div>
          {parseFloat(invoice.discount.toString()) > 0 && (
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Descuento:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -${parseFloat(invoice.discount.toString()).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>ITBMS (IVA 7%):</span>
            <span className="font-medium">${parseFloat(invoice.itbms.toString()).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-indigo-300 dark:border-indigo-700">
            <span>Total:</span>
            <span className="text-indigo-600 dark:text-indigo-400">${parseFloat(invoice.total.toString()).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      {invoice.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notas / Observaciones</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Historial de Correos (solo si está certificada) */}
      {invoice.status === "CERTIFIED" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Historial de Correos Enviados
          </h2>
          <EmailHistory invoiceId={invoice.id} />
        </div>
      )}

      {/* Información Adicional */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información Adicional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Creado por:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.user.name}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Fecha de emisión:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {format(new Date(invoice.issueDate), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Moneda:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.currency || "PAB"}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">ID de Referencia:</span>
            <span className="ml-2 font-mono text-xs text-gray-900 dark:text-gray-100">{invoice.clientReferenceId}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

