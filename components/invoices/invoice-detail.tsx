"use client"

import { Download, Send, XCircle, CheckCircle, Clock, FileText, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useState } from "react"

interface InvoiceDetailProps {
  invoice: any
  organizationId: string
}

const statusConfig = {
  DRAFT: {
    label: "Borrador",
    color: "bg-gray-100 text-gray-800",
    icon: FileText,
  },
  PENDING: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  PROCESSING: {
    label: "Procesando",
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  APPROVED: {
    label: "Aprobada",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rechazada",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelada",
    color: "bg-gray-100 text-gray-800",
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
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Factura {invoice.invoiceNumber || "Sin número"}
            </h1>
            <p className="text-gray-600 mt-1">
              Creada el {format(new Date(invoice.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {invoice.status === "APPROVED" && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Descargar PDF</span>
            </button>
          )}
          {invoice.status === "PENDING" && (
            <button
              onClick={handleSendToHKA}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              <span>{isProcessing ? "Enviando..." : "Enviar a HKA"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className="h-6 w-6 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <p className="text-lg font-semibold text-gray-900">{status.label}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {invoice.cufe && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">CUFE (Código Único)</p>
            <p className="text-sm font-mono text-gray-900 mt-1">{invoice.cufe}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos del Emisor */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Emisor</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Nombre:</span>
              <span className="ml-2 font-medium text-gray-900">{invoice.issuerName}</span>
            </div>
            <div>
              <span className="text-gray-600">RUC:</span>
              <span className="ml-2 font-medium text-gray-900">{invoice.issuerRuc}-{invoice.issuerDv}</span>
            </div>
            <div>
              <span className="text-gray-600">Dirección:</span>
              <span className="ml-2 font-medium text-gray-900">{invoice.issuerAddress}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium text-gray-900">{invoice.issuerEmail}</span>
            </div>
          </div>
        </div>

        {/* Datos del Receptor */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Receptor (Cliente)</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Nombre:</span>
              <span className="ml-2 font-medium text-gray-900">{invoice.receiverName}</span>
            </div>
            <div>
              <span className="text-gray-600">RUC:</span>
              <span className="ml-2 font-medium text-gray-900">
                {invoice.receiverRuc}{invoice.receiverDv && `-${invoice.receiverDv}`}
              </span>
            </div>
            {invoice.receiverAddress && (
              <div>
                <span className="text-gray-600">Dirección:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.receiverAddress}</span>
              </div>
            )}
            {invoice.receiverEmail && (
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.receiverEmail}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items de la Factura */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Items</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IVA</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.lineNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {parseFloat(item.quantity.toString()).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    ${parseFloat(item.unitPrice.toString()).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    ${parseFloat(item.taxAmount.toString()).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    ${parseFloat(item.total.toString()).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Totales</h2>
        
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">${parseFloat(invoice.subtotal.toString()).toFixed(2)}</span>
          </div>
          {parseFloat(invoice.discount.toString()) > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Descuento:</span>
              <span className="font-medium text-red-600">
                -${parseFloat(invoice.discount.toString()).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>ITBMS (IVA 7%):</span>
            <span className="font-medium">${parseFloat(invoice.itbms.toString()).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-indigo-300">
            <span>Total:</span>
            <span className="text-indigo-600">${parseFloat(invoice.total.toString()).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      {invoice.notes && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas / Observaciones</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Información Adicional */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Creado por:</span>
            <span className="ml-2 font-medium text-gray-900">{invoice.user.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Fecha de emisión:</span>
            <span className="ml-2 font-medium text-gray-900">
              {format(new Date(invoice.issueDate), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Moneda:</span>
            <span className="ml-2 font-medium text-gray-900">{invoice.currency || "PAB"}</span>
          </div>
          <div>
            <span className="text-gray-600">ID de Referencia:</span>
            <span className="ml-2 font-mono text-xs text-gray-900">{invoice.clientReferenceId}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

