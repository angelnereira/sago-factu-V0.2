"use client"

import { useState } from "react"
import { CheckCircle, Download, FileText, Copy, ExternalLink, QrCode } from "lucide-react"
import { formatPanamaDateReadable } from "@/lib/utils/date-timezone"

interface InvoiceSuccessResponseProps {
  data: {
    invoiceId: string
    cufe?: string
    cafe?: string
    numeroDocumentoFiscal?: string
    qrUrl?: string
    protocoloAutorizacion?: string
    fechaRecepcionDGI?: string | null
  }
}

export function InvoiceSuccessResponse({ data }: InvoiceSuccessResponseProps) {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const copiarCUFE = () => {
    if (!data.cufe) return
    
    navigator.clipboard.writeText(data.cufe)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const descargarPDF = async () => {
    try {
      setDownloading(true)
      
      const response = await fetch(`/api/invoices/${data.invoiceId}/pdf`)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error al obtener PDF' }))
        throw new Error(error.error || 'Error al descargar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${data.numeroDocumentoFiscal || data.invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      alert('Error al descargar el PDF. Por favor, inténtalo de nuevo.')
    } finally {
      setDownloading(false)
    }
  }

  const descargarXML = async () => {
    try {
      setDownloading(true)
      
      const response = await fetch(`/api/invoices/${data.invoiceId}/xml`)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error al obtener XML' }))
        throw new Error(error.error || 'Error al descargar XML')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${data.numeroDocumentoFiscal || data.invoiceId}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar XML:', error)
      alert('Error al descargar el XML. Por favor, inténtalo de nuevo.')
    } finally {
      setDownloading(false)
    }
  }

  const abrirQR = () => {
    if (data.qrUrl) {
      window.open(data.qrUrl, '_blank')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Header con ícono de éxito */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ¡Factura Enviada Exitosamente!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          La factura ha sido certificada por la DGI de Panamá
        </p>
      </div>

      {/* Número de Documento Fiscal */}
      {data.numeroDocumentoFiscal && (
        <div className="text-center py-4 border-t border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Número de Documento Fiscal
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {data.numeroDocumentoFiscal}
          </p>
        </div>
      )}

      {/* CUFE */}
      {data.cufe && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              CUFE (Código Único de Factura Electrónica)
            </label>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
              Código Único
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md font-mono text-xs break-all text-gray-900 dark:text-gray-100">
              {data.cufe}
            </div>
            <button
              onClick={copiarCUFE}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              title="Copiar CUFE"
            >
              <Copy className={`h-4 w-4 ${copied ? 'text-green-600' : ''}`} />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 dark:text-green-400">✓ CUFE copiado al portapapeles</p>
          )}
        </div>
      )}

      {/* CAFE (si está disponible) */}
      {data.cafe && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            CAFE (Código de Autorización FE)
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md font-mono text-xs break-all text-gray-900 dark:text-gray-100">
            {data.cafe}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {data.fechaRecepcionDGI && (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Fecha Recepción DGI</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatPanamaDateReadable(data.fechaRecepcionDGI, true)}
            </p>
          </div>
        )}
        {data.protocoloAutorizacion && (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Protocolo Autorización</p>
            <p className="font-medium font-mono text-xs text-gray-900 dark:text-gray-100">
              {data.protocoloAutorizacion}
            </p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={descargarPDF}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5" />
            <span>Descargar PDF</span>
          </button>

          <button
            onClick={descargarXML}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-5 w-5" />
            <span>Descargar XML</span>
          </button>
        </div>

        {data.qrUrl && (
          <button
            onClick={abrirQR}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <QrCode className="h-5 w-5" />
            <span>Ver Código QR de Consulta DGI</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nota informativa */}
      {data.qrUrl && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> El código QR permite a cualquier persona verificar la 
            autenticidad de esta factura en el portal de la DGI de Panamá.
          </p>
        </div>
      )}
    </div>
  )
}

