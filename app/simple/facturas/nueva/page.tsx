'use client'

import { useState } from 'react'
import { XMLUploader } from '@/components/invoices/xml-uploader'
import Link from 'next/link'

interface ItemInput {
  description: string
  quantity: number
  unitPrice: number
}

export default function NewSimpleInvoicePage() {
  const [customerName, setCustomerName] = useState('')
  const [customerRuc, setCustomerRuc] = useState('')
  const [customerDv, setCustomerDv] = useState('')
  const [items, setItems] = useState<ItemInput[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
    setSuccess('')
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

      setSuccess('Archivo importado correctamente')

      if (sendDirectOnImport) {
        // Tras autocompletar, enviar inmediatamente usando el mismo submit local
        await handleSubmit()
      }
    } catch (e: any) {
      setError(e.message || 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    // Validaciones mínimas
    if (!customerName || !customerRuc || !customerDv) {
      setError('Completa nombre, RUC y DV del cliente')
      setLoading(false)
      return
    }
    if (items.length === 0 || items.some((it) => !it.description || it.unitPrice <= 0 || it.quantity <= 0)) {
      setError('Agrega al menos un item válido (cantidad y precio > 0)')
      setLoading(false)
      return
    }

    try {
      // Crear factura (usa API existente)
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

      // Procesar factura (enviar a HKA con credenciales del modo simple, vía backend)
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

      setSuccess('Factura creada y enviada correctamente')
      // Limpiar formulario
      setCustomerName('')
      setCustomerRuc('')
      setCustomerDv('')
      setItems([{ description: '', quantity: 1, unitPrice: 0 }])
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error')
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nueva Factura</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Crear y enviar una nueva factura electrónica</p>
        </div>
        <Link href="/simple">
          <button className="px-4 py-2 border rounded-lg text-sm">Volver</button>
        </Link>
      </div>

      {/* Importar archivo (drag & drop consistente con otros usuarios) */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Importar factura (XML / Excel)</h3>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sendDirectOnImport}
              onChange={(e) => setSendDirectOnImport(e.target.checked)}
            />
            Enviar directo al importar
          </label>
        </div>
        <XMLUploader onDataExtracted={applyImportedData} />
      </div>

      {/* Cliente */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold mb-4">Datos del Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2">Nombre / Razón Social</label>
            <input
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Cliente S.A."
            />
          </div>
          <div>
            <label className="block text-sm mb-2">RUC</label>
            <input
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
              value={customerRuc}
              onChange={(e) => setCustomerRuc(e.target.value)}
              placeholder="155738031-2-2023"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">DV</label>
            <input
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
              value={customerDv}
              onChange={(e) => setCustomerDv(e.target.value)}
              placeholder="20"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Items</h3>
          <button onClick={addItem} className="px-3 py-1.5 border rounded-lg text-sm">
            Agregar Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <input
                className="md:col-span-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                placeholder="Descripción"
                value={it.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
              />
              <input
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                type="number"
                min={1}
                placeholder="Cantidad"
                value={it.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Precio Unitario"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Subtotal + ITBMS (si aplica)</p>
            <p className="text-xl font-semibold">${total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-2">
        <Link href="/simple">
          <button className="px-4 py-2 border rounded-lg">Cancelar</button>
        </Link>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Crear y Enviar'}
        </button>
      </div>
    </div>
  )
}
