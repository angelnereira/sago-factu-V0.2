"use client"

import { Download, Send, XCircle, CheckCircle, Clock, FileText, ArrowLeft, FileCode, Copy, Printer, Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { SendEmailButton } from "./send-email-button"
import { EmailHistory } from "./email-history"
import { InvoiceSuccessResponse } from "./invoice-success-response"
import { useRouter } from "next/navigation"
import { formatPanamaDateReadable, formatPanamaDateShort } from "@/lib/utils/date-timezone"
import { QRCodeSVG } from "qrcode.react"

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
  QUEUED: {
    label: "En Cola",
    color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400",
    icon: Clock,
  },
  PROCESSING: {
    label: "Procesando",
    color: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
    icon: Clock,
  },
  EMITTED: {
    label: "Emitida",
    color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    icon: CheckCircle,
  },
  CERTIFIED: {
    label: "Certificada",
    color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rechazada",
    color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Anulada",
    color: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
    icon: XCircle,
  },
  ERROR: {
    label: "Error",
    color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    icon: XCircle,
  },
}

export function InvoiceDetail({ invoice, organizationId }: InvoiceDetailProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any>(null)
  const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.DRAFT
  const StatusIcon = status.icon

  // Preparar datos para mostrar InvoiceSuccessResponse si la factura está certificada
  const certifiedData = invoice.status === "CERTIFIED" || invoice.status === "EMITTED" ? {
    invoiceId: invoice.id,
    cufe: invoice.cufe || undefined,
    cafe: invoice.cafe || undefined,
    numeroDocumentoFiscal: invoice.numeroDocumentoFiscal || undefined,
    qrUrl: invoice.qrUrl || undefined,
    qrCode: invoice.qrCode || undefined,
    protocoloAutorizacion: invoice.hkaProtocol || undefined,
    fechaRecepcionDGI: invoice.hkaProtocolDate ? new Date(invoice.hkaProtocolDate).toISOString() : null,
    pdfBase64: invoice.pdfBase64 || undefined,
  } : null

  const displayData = successData || certifiedData

  const handleSendToHKA = async () => {
    setIsProcessing(true)
    setDownloadError(null)
    setSuccessData(null)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Error al procesar factura')
      }

      if (result.data) {
        setSuccessData(result.data)
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      } else {
        router.refresh()
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Error al enviar factura')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadError(null)
    try {
      // Si tenemos el PDF en base64, descargarlo directamente
      if (invoice.pdfBase64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${invoice.pdfBase64}`;
        link.download = `Factura_${invoice.numeroDocumentoFiscal || invoice.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const response = await fetch(`/api/invoices/${invoice.id}/pdf`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error al obtener PDF' }))
        throw new Error(error.error || 'Error al descargar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const fileName = invoice.numeroDocumentoFiscal
        ? `Factura_${invoice.numeroDocumentoFiscal.replace(/\//g, '-')}.pdf`
        : `Factura_${invoice.id}.pdf`

      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error al descargar PDF:", error)
      setDownloadError(error instanceof Error ? error.message : 'Error al descargar PDF')
    }
  }

  const handleDownloadXML = async () => {
    setDownloadError(null)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/xml`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error al obtener XML' }))
        throw new Error(error.error || 'Error al descargar XML')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const fileName = invoice.numeroDocumentoFiscal
        ? `Factura_${invoice.numeroDocumentoFiscal.replace(/\//g, '-')}.xml`
        : `Factura_${invoice.id}.xml`

      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error al descargar XML:", error)
      setDownloadError(error instanceof Error ? error.message : 'Error al descargar XML')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Podríamos mostrar un toast aquí
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Factura {invoice.invoiceNumber || "Sin número"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {invoice.customer?.name || invoice.receiverName} • {formatPanamaDateReadable(invoice.createdAt, false)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {(invoice.status === "QUEUED" || invoice.status === "DRAFT") && (
            <button
              onClick={handleSendToHKA}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isProcessing ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>{isProcessing ? "Enviando..." : "Emitir Factura"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Modal/Banner */}
      {successData && (
        <div className="mb-6">
          <InvoiceSuccessResponse data={successData} />
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => {
                setSuccessData(null)
                router.refresh()
              }}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Cerrar y ver detalles
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {downloadError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{downloadError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Detalle de la Factura</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desc</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cant</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {invoice.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-medium">{item.description}</div>
                        {item.code && <div className="text-xs text-gray-500">{item.code}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                        {parseFloat(item.quantity.toString()).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                        ${parseFloat(item.unitPrice.toString()).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        ${parseFloat(item.total.toString()).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-2 items-end">
                <div className="flex justify-between w-full sm:w-64 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${parseFloat(invoice.subtotal.toString()).toFixed(2)}</span>
                </div>
                {parseFloat(invoice.discount.toString()) > 0 && (
                  <div className="flex justify-between w-full sm:w-64 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">-${parseFloat(invoice.discount.toString()).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full sm:w-64 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ITBMS (7%):</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${parseFloat(invoice.itbms.toString()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full sm:w-64 text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700 mt-1">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">${parseFloat(invoice.total.toString()).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Issuer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Cliente</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.receiverName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">RUC: {invoice.receiverRuc}-{invoice.receiverDv}</p>
                {invoice.receiverEmail && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.receiverEmail}</p>}
                {invoice.receiverAddress && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.receiverAddress}</p>}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Emisor</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.issuerName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">RUC: {invoice.issuerRuc}-{invoice.issuerDv}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.issuerEmail}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.issuerAddress}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notas</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Fiscal Panel */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Estado Fiscal</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>

            {(invoice.status === "CERTIFIED" || invoice.status === "EMITTED") && (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center py-4 bg-white rounded-lg border border-gray-100">
                  {invoice.qrCode ? (
                    // Si tenemos el QR en base64 (imagen), lo mostramos
                    <img src={`data:image/png;base64,${invoice.qrCode}`} alt="QR Factura" className="w-32 h-32 object-contain" />
                  ) : invoice.qrUrl ? (
                    // Si tenemos URL, generamos el QR
                    <QRCodeSVG value={invoice.qrUrl} size={128} />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400">Sin QR</div>
                  )}
                </div>

                {/* CUFE */}
                {invoice.cufe && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CUFE</label>
                    <div className="flex gap-2">
                      <code className="flex-1 text-xs bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-200 dark:border-gray-700 break-all font-mono text-gray-600 dark:text-gray-300">
                        {invoice.cufe}
                      </code>
                      <button
                        onClick={() => copyToClipboard(invoice.cufe)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Copiar CUFE"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Descargar PDF
                  </button>
                  <button
                    onClick={handleDownloadXML}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <FileCode className="w-4 h-4" />
                    Descargar XML
                  </button>
                  <SendEmailButton
                    invoiceId={invoice.id}
                    defaultEmail={invoice.receiverEmail || undefined}
                    variant="outline"
                    className="w-full justify-center"
                  />
                </div>
              </div>
            )}

            {invoice.status === "ERROR" && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Error de Emisión</p>
                <p className="text-xs text-red-500 dark:text-red-300">{invoice.hkaResponseMessage || "Ocurrió un error desconocido."}</p>
              </div>
            )}
          </div>

          {/* Email History */}
          {(invoice.status === "CERTIFIED" || invoice.status === "EMITTED") && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Historial de Envíos
              </h3>
              <EmailHistory invoiceId={invoice.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

