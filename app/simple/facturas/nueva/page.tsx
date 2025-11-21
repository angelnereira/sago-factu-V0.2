'use client'

import { useState } from 'react'
import { XMLUploader } from '@/components/invoices/xml-uploader'
import { InvoiceSuccessModal } from '@/components/invoices/invoice-success-modal'
import Link from 'next/link'
import { Send, Save, Loader2, AlertCircle } from 'lucide-react'

interface ItemInput {
  description: string
  quantity: number
  unitPrice: number
}

type InvoiceStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'

export default function NewSimpleInvoicePage() {
  const [customerName, setCustomerName] = useState('')
  const [customerRuc, setCustomerRuc] = useState('')
  const [customerDv, setCustomerDv] = useState('')
  const [items, setItems] = useState<ItemInput[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ])

  const [status, setStatus] = useState<InvoiceStatus>('IDLE')
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<any>(null)

  const [sendDirectOnImport, setSendDirectOnImport] = useState(false)
  const [importing, setImporting] = useState(false)

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ItemInput, value: string) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
            ...it,
            [field]:
              field === 'quantity' || field === 'unitPrice'
                ? Number(value)
                : value,
          }
          : it,
      ),
    )
  }

  const total = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  )

  const handleImport = async (file: File | null) => {
    if (!file) return
    setError('')
    setImporting(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('sendDirect', String(sendDirectOnImport))

      const res = await fetch('/api/simple/invoices/import', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al importar el archivo')
      }

      const parsed = data.data || {}
      if (parsed.customer) {
        if (parsed.customer.name) setCustomerName(parsed.customer.name)
        if (parsed.customer.ruc) setCustomerRuc(parsed.customer.ruc)
        if (parsed.customer.dv) setCustomerDv(parsed.customer.dv)
      }
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        const mapped: ItemInput[] = parsed.items.map((it: any) => ({
          description: String(it.description || ''),
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
        }))
        setItems(mapped)
      }

      if (sendDirectOnImport) {
        await handleSubmit()
      }
    } catch (e: any) {
      setError(e.message || 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  const handleSubmit = async (asDraft = false) => {
    setStatus('LOADING')
    setLoadingStep('Validando datos...')
    setError('')

    // Validaciones mínimas
    if (!customerName || !customerRuc || !customerDv) {
      setError('Completa nombre, RUC y DV del cliente')
      setStatus('IDLE')
      return
    }
    if (items.length === 0 || items.some((it) => !it.description || it.unitPrice <= 0 || it.quantity <= 0)) {
      setError('Agrega al menos un item válido (cantidad y precio > 0)')
      setStatus('IDLE')
      return
    }

    try {
      // 1. Crear factura (Borrador)
      setLoadingStep('Guardando borrador...')
      const createRes = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            name: customerName,
            taxId: customerDv ? `${customerRuc}-${customerDv}` : customerRuc,
            address: 'No especificada',
            email: '',
            phone: '',
            city: 'Panamá',
            country: 'PA',
          },
          items: items.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            taxRate: 7,
            discount: 0,
          })),
          notes: '',
          paymentMethod: 'CASH',
        }),
      })

      const createData = await createRes.json()
      if (!createRes.ok) {
        throw new Error(createData.error || 'Error al crear factura')
      }

      const invoiceId: string = createData.data?.id || createData.id
      if (!invoiceId) {
        throw new Error('No se obtuvo el ID de la factura creada')
      }

      if (asDraft) {
        setStatus('IDLE')
        // Opcional: Redirigir o mostrar toast de "Guardado"
        alert('Borrador guardado correctamente')
        return
      }

      // 2. Procesar factura (Emitir a HKA)
      setLoadingStep('Conectando con PAC/DGI...')
      const processRes = await fetch(`/api/invoices/${invoiceId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendToHKA: true, sendEmail: false }),
      })
      const processData = await processRes.json()

      if (!processRes.ok) {
        const details = processData?.error || processData?.message || ''
        throw new Error(details || 'Error al procesar factura')
      }

      if (processData.success && processData.data) {
        console.log('✅ [Simple] Respuesta HKA recibida:', processData.data)
        setSuccessData(processData.data)
        setStatus('SUCCESS')
      } else {
        // Caso raro donde es 200 OK pero success false
        throw new Error('La respuesta del PAC no indicó éxito.')
      }

    } catch (e: any) {
      console.error(e)
      setError(e.message || 'Ocurrió un error inesperado')
      setStatus('ERROR')
    }
  }

  const applyImportedData = (data: any) => {
    try {
      // Cliente
      if (data?.client) {
        if (data.client.name) setCustomerName(String(data.client.name))
        if (data.client.taxId) {
          const tax = String(data.client.taxId)
          setCustomerRuc(tax)
          const parts = tax.split('-')
          if (parts.length >= 2) {
            setCustomerDv(parts[parts.length - 1])
          }
        }
      }
      // Items
      if (Array.isArray(data?.items)) {
        const mapped = data.items.map((it: any) => ({
          description: String(it.description || ''),
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
        }))
        if (mapped.length > 0) setItems(mapped)
      }
      // Envío directo opcional
      if (sendDirectOnImport) {
        void handleSubmit()
      }
    } catch (_) {
      // Silencioso: el usuario puede corregir manualmente
    }
  }

  const handleReset = () => {
    setSuccessData(null)
    setStatus('IDLE')
    setCustomerName('')
    setCustomerRuc('')
    setCustomerDv('')
    setItems([{ description: '', quantity: 1, unitPrice: 0 }])
    setError('')
  }

  return (
    <div className="space-y-6 relative">
      {/* Modal de Éxito */}
      <InvoiceSuccessModal
        isOpen={status === 'SUCCESS' && !!successData}
        invoiceNumber={successData?.invoiceNumber || '---'}
        cufe={successData?.cufe || ''}
        qrCodeUrl={successData?.qrCode || ''}
        pdfBase64={successData?.pdfBase64} // Asegúrate que tu API retorne esto o ajusta según necesidad
        onNewInvoice={handleReset}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nueva Factura</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Crear y enviar una nueva factura electrónica</p>
        </div>
        <Link href="/simple">
          <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Volver
          </button>
        </Link>
      </div>

      {/* Alerta de Error Persistente */}
      {status === 'ERROR' && error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Error de Emisión</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Importar archivo */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Importar factura (XML / Excel)</h3>
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={sendDirectOnImport}
              onChange={(e) => setSendDirectOnImport(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Enviar directo al importar
          </label>
        </div>
        <XMLUploader onDataExtracted={applyImportedData} />
      </div>

      {/* Formulario Principal */}
      <div className={`space-y-6 transition-opacity duration-200 ${status === 'LOADING' ? 'opacity-50 pointer-events-none' : ''}`}>

        {/* Cliente */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Datos del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre / Razón Social</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Cliente S.A."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">RUC</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={customerRuc}
                onChange={(e) => setCustomerRuc(e.target.value)}
                placeholder="155738031-2-2023"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">DV</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={customerDv}
                onChange={(e) => setCustomerDv(e.target.value)}
                placeholder="20"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Items de Factura</h3>
            <button
              onClick={addItem}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              + Agregar Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="md:col-span-6">
                  <input
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Descripción del producto o servicio"
                    value={it.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                    type="number"
                    min={1}
                    placeholder="Cant."
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar item"
                  >
                    <span className="sr-only">Eliminar</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total a Pagar</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                ${total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Acciones Flotante o Fija */}
      <div className="sticky bottom-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg flex justify-between items-center gap-4 z-10">
        <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
          {status === 'LOADING' ? (
            <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingStep}
            </span>
          ) : (
            <span>Listo para emitir</span>
          )}
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => handleSubmit(true)}
            disabled={status === 'LOADING'}
            className="flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Guardar Borrador</span>
            <span className="sm:hidden">Guardar</span>
          </button>

          <button
            onClick={() => handleSubmit(false)}
            disabled={status === 'LOADING'}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'LOADING' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{status === 'LOADING' ? 'Procesando...' : 'Emitir Factura Fiscal'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
