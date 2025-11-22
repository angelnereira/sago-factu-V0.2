"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Save, Send, FileUp } from "lucide-react"
import {
  type InvoiceItem,
  type Client,
  calculateItemTotals,
  calculateInvoiceTotals
} from "@/lib/validations/invoice"
import { XMLUploader } from "./xml-uploader"
import { RucValidationField } from "./ruc-validation-field"
import type { ParsedInvoiceData } from "@/lib/utils/xml-parser"

interface InvoiceFormProps {
  organizationId: string
  userId: string
}

export function InvoiceForm({ organizationId, userId }: InvoiceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showXMLUploader, setShowXMLUploader] = useState(false)

  // Estado del cliente
  const [client, setClient] = useState<Client>({
    name: "",
    taxId: "",
    email: "",
    phone: "",
    address: "",
    city: "Panamá",
    country: "PA",
  })

  // Estado de los items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 7,
      discount: 0,
    },
  ])

  // Estado adicional
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER" | "CHECK" | "OTHER">("CASH")

  // Función para aplicar datos del XML
  const handleXMLDataExtracted = (data: ParsedInvoiceData) => {
    // Aplicar datos del cliente
    setClient({
      name: data.client.name,
      taxId: data.client.taxId,
      email: data.client.email || "",
      phone: data.client.phone || "",
      address: data.client.address,
      city: data.client.city || "Panamá",
      country: data.client.country || "PA",
    })

    // Aplicar items
    setItems(data.items)

    // Aplicar información adicional
    if (data.notes) {
      setNotes(data.notes)
    }
    if (data.paymentMethod) {
      setPaymentMethod(data.paymentMethod as any)
    }

    // Ocultar uploader
    setShowXMLUploader(false)
  }

  // Agregar item
  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 7,
        discount: 0,
      },
    ])
  }

  // Eliminar item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  // Actualizar item
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // Calcular totales
  const totals = calculateInvoiceTotals(items)

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/invoices/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client,
          items,
          notes,
          paymentMethod,
          saveAsDraft,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la factura")
      }

      // Redirigir a la factura creada
      router.push(`/dashboard/facturas/${data.data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
      {/* Botón para mostrar/ocultar uploader XML */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileUp className="h-6 w-6 text-indigo-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                ¿Tienes un archivo XML o Excel de factura?
              </h3>
              <p className="text-xs text-gray-600">
                Sube tu XML o Excel y autocompletaremos el formulario por ti
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowXMLUploader(!showXMLUploader)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            {showXMLUploader ? "Ocultar" : "Subir Archivo"}
          </button>
        </div>
      </div>

      {/* Uploader de XML */}
      {showXMLUploader && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <XMLUploader onDataExtracted={handleXMLDataExtracted} />
        </div>
      )}

      {/* Sección: Datos del Cliente */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Cliente</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre / Razón Social *
            </label>
            <input
              type="text"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <RucValidationField
              value={client.taxId}
              onRucChange={(ruc) => setClient({ ...client, taxId: ruc })}
              onDataFound={(dv, razonSocial) => {
                // Auto-populate name and DV if not already set
                if (!client.name || client.name.trim() === "") {
                  setClient({
                    ...client,
                    name: razonSocial,
                  })
                }
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={client.email}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={client.phone}
              onChange={(e) => setClient({ ...client, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección *
            </label>
            <input
              type="text"
              value={client.address}
              onChange={(e) => setClient({ ...client, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              value={client.city}
              onChange={(e) => setClient({ ...client, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Sección: Items de la Factura */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Item</span>
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const itemTotals = calculateItemTotals(item)
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Item {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Unit. *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IVA (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.taxRate}
                      onChange={(e) => updateItem(index, "taxRate", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-end space-x-6 text-sm">
                    <span className="text-gray-600">Subtotal: <strong>${itemTotals.subtotal.toFixed(2)}</strong></span>
                    <span className="text-gray-600">IVA: <strong>${itemTotals.taxAmount.toFixed(2)}</strong></span>
                    <span className="text-gray-900 font-semibold">Total: ${itemTotals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sección: Información Adicional */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CHECK">Cheque</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas / Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Información adicional para la factura..."
            />
          </div>
        </div>
      </div>

      {/* Resumen de Totales */}
      <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
        
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Descuento:</span>
              <span className="font-medium text-red-600">-${totals.totalDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>IVA (7%):</span>
            <span className="font-medium">${totals.totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-indigo-300">
            <span>Total:</span>
            <span className="text-indigo-600">${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={(e) => handleSubmit(e as any, true)}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          <span>{isLoading ? "Guardando..." : "Guardar como Borrador"}</span>
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
          <span>{isLoading ? "Emitiendo..." : "Emitir Factura"}</span>
        </button>
      </div>
    </form>
  )
}

