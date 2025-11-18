/**
 * DEPRECATED: This component is no longer used.
 *
 * Folio purchase functionality has been deprecated. Folios are now managed
 * exclusively through HKA synchronization.
 *
 * This file is kept for backwards compatibility and historical reference.
 * It can be safely deleted after migration period (after 2025-12-17).
 */

"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface FolioPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * @deprecated This component is no longer functional.
 * Use HKA synchronization (POST /api/folios/sincronizar) instead.
 */
export function FolioPurchaseModal({ isOpen, onClose }: FolioPurchaseModalProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(100)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const pricePerFolio = 0.06 // Precio por folio en USD
  const totalPrice = quantity * pricePerFolio

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/folios/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al comprar folios")
      }

      // Éxito - cerrar modal y recargar
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Comprar Folios</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cantidad */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cantidad de Folios
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max="10000"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
              Mínimo: 1 folio | Máximo: 10,000 folios
            </p>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Precio por folio:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">${pricePerFolio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Cantidad:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{quantity}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Total:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Nota informativa */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Los folios serán comprados a través de The Factory HKA y 
              estarán disponibles inmediatamente después de la compra.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900/30 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || quantity < 1}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Comprando..." : "Comprar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

