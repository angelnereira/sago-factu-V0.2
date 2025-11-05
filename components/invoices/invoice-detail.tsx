"use client"

import { Download, Send, XCircle, CheckCircle, Clock, FileText, ArrowLeft, FileCode } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { SendEmailButton } from "./send-email-button"
import { EmailHistory } from "./email-history"
import { InvoiceSuccessResponse } from "./invoice-success-response"
import { useRouter } from "next/navigation"
import { formatPanamaDateReadable, formatPanamaDateShort } from "@/lib/utils/date-timezone"

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
  // LOG SÍNCRONO - Se ejecuta SIEMPRE al renderizar el componente
  console.log('🚨 [InvoiceDetail] Componente renderizado!', {
    invoiceId: invoice?.id,
    status: invoice?.status,
    hasCufe: !!invoice?.cufe,
    timestamp: new Date().toISOString(),
  })
  
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any>(null)
  const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.DRAFT
  const StatusIcon = status.icon

  // Preparar datos para mostrar InvoiceSuccessResponse si la factura está certificada
  // IMPORTANTE: Mostrar siempre si está certificada, incluso sin CUFE/CAFE (para mostrar datos parciales)
  const certifiedData = invoice.status === "CERTIFIED" ? {
    invoiceId: invoice.id,
    cufe: invoice.cufe || undefined,
    cafe: invoice.cafe || undefined,
    numeroDocumentoFiscal: invoice.numeroDocumentoFiscal || undefined,
    qrUrl: invoice.qrUrl || undefined,
    qrCode: invoice.qrCode || undefined,
    protocoloAutorizacion: invoice.hkaProtocol || undefined,
    fechaRecepcionDGI: invoice.hkaProtocolDate ? new Date(invoice.hkaProtocolDate).toISOString() : null,
  } : null

  // Mostrar successData si existe (después de enviar) o certifiedData si la factura ya está certificada
  const displayData = successData || certifiedData

  // Debug: Log para verificar datos (SIEMPRE se ejecuta en el cliente)
  useEffect(() => {
    const debugInfo = {
      status: invoice.status,
      invoiceId: invoice.id,
      hasCufe: !!invoice.cufe,
      cufe: invoice.cufe,
      hasCafe: !!invoice.cafe,
      cafe: invoice.cafe,
      hasQrCode: !!invoice.qrCode,
      hasQrUrl: !!invoice.qrUrl,
      qrUrl: invoice.qrUrl,
      hasNumeroFiscal: !!invoice.numeroDocumentoFiscal,
      numeroDocumentoFiscal: invoice.numeroDocumentoFiscal,
      certifiedData: certifiedData ? 'EXISTE' : 'NULL',
      successData: successData ? 'EXISTE' : 'NULL',
      displayData: displayData ? 'EXISTE' : 'NULL',
      willShowComponent: !!displayData,
    }
    console.log('🔍 [InvoiceDetail] Debug (useEffect):', debugInfo)
    console.log('✅ [InvoiceDetail] Componente renderizado correctamente')
    
    // Alert visual si está certificada pero no tiene displayData
    if (invoice.status === 'CERTIFIED' && !displayData) {
      console.warn('⚠️ [InvoiceDetail] Factura CERTIFIED pero sin displayData!', {
        certifiedData,
        successData,
      })
    }
  }, [invoice.status, invoice.cufe, invoice.cafe, invoice.id, invoice.qrCode, invoice.qrUrl, invoice.numeroDocumentoFiscal, certifiedData, successData, displayData])

  const handleSendToHKA = async () => {
    setIsProcessing(true)
    setDownloadError(null)
    setSuccessData(null)
    try {
      console.log('🚀 [InvoiceDetail] Enviando factura a HKA...', invoice.id)
      
      const response = await fetch(`/api/invoices/${invoice.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      console.log('📥 [InvoiceDetail] Respuesta recibida:', result)

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Error al procesar factura')
      }

      // Si hay datos de respuesta exitosa, mostrarlos
      if (result.data) {
        console.log('✅ [InvoiceDetail] Estableciendo successData:', result.data)
        setSuccessData(result.data)
        // Scroll al inicio para mostrar el componente
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      } else {
        console.log('⚠️ [InvoiceDetail] No hay result.data, recargando página...')
        // Recargar la página para mostrar el nuevo estado y CUFE
        router.refresh()
      }
    } catch (error) {
      console.error("❌ [InvoiceDetail] Error al enviar a HKA:", error)
      setDownloadError(error instanceof Error ? error.message : 'Error al enviar factura')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadError(null)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error al obtener PDF' }))
        throw new Error(error.error || 'Error al descargar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Usar número fiscal si está disponible, sino CUFE o ID
      const fileName = invoice.numeroDocumentoFiscal 
        ? `Factura_${invoice.numeroDocumentoFiscal.replace(/\//g, '-')}.pdf`
        : invoice.cufe 
        ? `Factura_${invoice.cufe.substring(0, 20)}.pdf`
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
      
      // Usar número fiscal si está disponible, sino CUFE o ID
      const fileName = invoice.numeroDocumentoFiscal 
        ? `Factura_${invoice.numeroDocumentoFiscal.replace(/\//g, '-')}.xml`
        : invoice.cufe 
        ? `Factura_${invoice.cufe.substring(0, 20)}.xml`
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

  return (
    <div className="space-y-6">
      {/* ALERTA VISIBLE - Siempre se muestra para verificar que el componente se renderiza */}
      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-200 font-bold">
          🔴 COMPONENTE InvoiceDetail CARGADO - Si ves esto, el componente funciona
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 font-mono mt-2">
          Invoice ID: {invoice?.id || 'NO DISPONIBLE'}
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 font-mono">
          Status: {invoice?.status || 'NO DISPONIBLE'}
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 font-mono">
          Timestamp: {new Date().toISOString()}
        </p>
      </div>

      {/* DEBUG: Mostrar siempre si está certificada para verificar renderizado */}
      {invoice.status === "CERTIFIED" && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 font-mono font-bold">
            🐛 DEBUG: Factura CERTIFIED detectada
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-mono mt-1">
            displayData: {displayData ? '✅ EXISTE' : '❌ NULL'}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
            hasCufe: {invoice.cufe ? '✅ SÍ' : '❌ NO'} | hasCafe: {invoice.cafe ? '✅ SÍ' : '❌ NO'}
          </p>
          {successData && (
            <p className="text-xs text-green-700 dark:text-green-300 font-mono mt-1">
              ✅ successData establecido (factura recién enviada)
            </p>
          )}
        </div>
      )}

      {/* Mostrar componente de respuesta exitosa si hay datos de éxito O si la factura ya está certificada */}
      {displayData ? (
        <div className="mb-6">
          <InvoiceSuccessResponse data={displayData} />
          {/* Solo mostrar botón "Continuar" si es successData (recién enviado) */}
          {successData && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setSuccessData(null)
                  router.refresh()
                }}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      ) : invoice.status === "CERTIFIED" ? (
        // Fallback: Si está certificada pero no tiene displayData, mostrar mensaje
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Factura certificada pero faltan datos de respuesta HKA. Recarga la página o contacta soporte.
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 font-mono">
            Debug: status={invoice.status}, hasCufe={invoice.cufe ? 'sí' : 'no'}, hasCafe={invoice.cafe ? 'sí' : 'no'}, 
            certifiedData={certifiedData ? 'EXISTE' : 'NULL'}
          </p>
        </div>
      ) : null}

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
              Creada el {formatPanamaDateReadable(invoice.createdAt, false)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {invoice.status === "CERTIFIED" && !displayData && (
            <>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                title="Descargar PDF certificado"
              >
                <Download className="h-5 w-5" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleDownloadXML}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                title="Descargar XML firmado"
              >
                <FileCode className="h-5 w-5" />
                <span>XML</span>
              </button>
              <SendEmailButton 
                invoiceId={invoice.id} 
                defaultEmail={invoice.receiverEmail || undefined}
              />
            </>
          )}
          {(invoice.status === "PENDING" || invoice.status === "DRAFT") && (
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

      {/* Error message */}
      {downloadError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {downloadError}
          </p>
        </div>
      )}

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

        {/* Información de Certificación */}
        {invoice.status === "CERTIFIED" && (invoice.cufe || invoice.cafe || invoice.numeroDocumentoFiscal || invoice.hkaResponseMessage) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Certificación DGI</p>
              {invoice.cufe && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">CUFE</p>
                  <p className="text-xs font-mono text-gray-900 dark:text-gray-100 break-all bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                    {invoice.cufe}
                  </p>
                </div>
              )}
              {invoice.cafe && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">CAFE</p>
                  <p className="text-xs font-mono text-gray-900 dark:text-gray-100 break-all bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                    {invoice.cafe}
                  </p>
                </div>
              )}
              {invoice.numeroDocumentoFiscal && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Número Fiscal</p>
                  <p className="text-xs font-mono text-gray-900 dark:text-gray-100 break-all bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                    {invoice.numeroDocumentoFiscal}
                  </p>
                </div>
              )}
              {invoice.hkaResponseMessage && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mensaje HKA</p>
                  <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    {invoice.hkaResponseMessage}
                  </p>
                </div>
              )}
              {invoice.certifiedAt && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Certificada el</p>
                  <p className="text-xs text-gray-900 dark:text-gray-100">
                    {formatPanamaDateReadable(invoice.certifiedAt, true)}
                  </p>
                </div>
              )}
            </div>
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
              {formatPanamaDateShort(invoice.issueDate)}
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

