"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2, Ticket } from "lucide-react"
import { User } from "@prisma/client"

interface AssignFoliosModalProps {
  user: User & {
    organization: {
      id: string
      name: string
      ruc: string | null
    } | null
  }
  isOpen: boolean
  onClose: () => void
}

export function AssignFoliosModal({ user, isOpen, onClose }: AssignFoliosModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    quantity: 10,
    price: 0.06, // 6 centavos por folio
    notes: "",
  })

  if (!isOpen) return null

  const totalCost = formData.quantity * formData.price

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!user.organizationId) {
        throw new Error("El usuario no tiene una organización asignada")
      }

      const response = await fetch("/api/admin/folios/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: user.organizationId,
          userId: user.id,
          quantity: formData.quantity,
          price: formData.price,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al asignar folios")
      }

      setSuccess(`✅ ${formData.quantity} folios asignados correctamente`)
      
      // Resetear formulario después de 2 segundos
      setTimeout(() => {
        setFormData({ quantity: 10, price: 0.06, notes: "" })
        router.refresh()
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Asignar Folios</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Usuario Info */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Asignar a:</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{user.email}</p>
              {user.organization && (
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                  Organización: {user.organization.name}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad de Folios
              </label>
              <input
                type="number"
                id="quantity"
                required
                min={1}
                max={10000}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Mínimo 1, máximo 10,000 folios
              </p>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio por Folio (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 dark:text-gray-500">$</span>
                <input
                  type="number"
                  id="price"
                  required
                  min={0}
                  step={0.01}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Precio actual: $0.06 (6 centavos)
              </p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas (Opcional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Ej: Asignación mensual de diciembre"
              />
            </div>

            {/* Total Cost */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Costo Total:</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">
                {formData.quantity} folios × ${formData.price.toFixed(2)} = ${totalCost.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900/30 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !user.organizationId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <Ticket className="h-4 w-4 mr-2" />
                    Asignar Folios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

