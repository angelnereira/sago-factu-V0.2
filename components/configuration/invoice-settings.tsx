"use client"

import { useState } from "react"
import { FileText, Save, AlertTriangle, Hash } from "lucide-react"
import { useRouter } from "next/navigation"

interface FolioStats {
  totalAssigned: number
  totalConsumed: number
}

interface InvoiceSettingsProps {
  organizationId: string
  folioStats: FolioStats
}

export function InvoiceSettings({ organizationId, folioStats }: InvoiceSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [settings, setSettings] = useState({
    invoicePrefix: "FEL",
    invoiceStartNumber: "1",
    folioAlertThreshold: "20",
    autoAssignFolios: true,
    requireClientEmail: false,
    defaultTaxRate: "7",
    defaultPaymentTerms: "30",
  })

  const handleChange = (field: string, value: string | boolean) => {
    setSettings({ ...settings, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/configuration/invoice-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar configuración")
      }

      setSuccess("✅ Configuración actualizada correctamente")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const availableFolios = folioStats.totalAssigned - folioStats.totalConsumed
  const folioUsagePercentage = folioStats.totalAssigned > 0
    ? Math.round((folioStats.totalConsumed / folioStats.totalAssigned) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <FileText className="h-6 w-6 text-indigo-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración de Facturación
          </h2>
          <p className="text-sm text-gray-600">
            Personaliza la numeración, alertas y comportamiento de las facturas
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {/* Folio Stats */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Folios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Asignados</p>
            <p className="text-2xl font-bold text-indigo-600">{folioStats.totalAssigned}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Consumidos</p>
            <p className="text-2xl font-bold text-red-600">{folioStats.totalConsumed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Disponibles</p>
            <p className="text-2xl font-bold text-green-600">{availableFolios}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Uso de Folios</span>
            <span>{folioUsagePercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                folioUsagePercentage > 80
                  ? "bg-red-500"
                  : folioUsagePercentage > 60
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${folioUsagePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Numeración */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Hash className="h-5 w-5 mr-2 text-indigo-600" />
            Numeración de Facturas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prefijo de Factura
              </label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                placeholder="FEL"
                maxLength={10}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ejemplo: FEL-2025-001
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número Inicial
              </label>
              <input
                type="number"
                value={settings.invoiceStartNumber}
                onChange={(e) => handleChange("invoiceStartNumber", e.target.value)}
                min="1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            Alertas de Folios
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Umbral de Alerta (%)
            </label>
            <input
              type="number"
              value={settings.folioAlertThreshold}
              onChange={(e) => handleChange("folioAlertThreshold", e.target.value)}
              min="1"
              max="100"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recibirás alertas cuando los folios disponibles caigan por debajo de este porcentaje
            </p>
          </div>
        </div>

        {/* Comportamiento */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Comportamiento
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Asignar folios automáticamente
                </label>
                <p className="text-xs text-gray-500">
                  Asignar folios a nuevos usuarios automáticamente
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAssignFolios}
                onChange={(e) => handleChange("autoAssignFolios", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Requerir email del cliente
                </label>
                <p className="text-xs text-gray-500">
                  El campo email será obligatorio en todas las facturas
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.requireClientEmail}
                onChange={(e) => handleChange("requireClientEmail", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Valores por Defecto */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Valores por Defecto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de Impuesto (%)
              </label>
              <input
                type="number"
                value={settings.defaultTaxRate}
                onChange={(e) => handleChange("defaultTaxRate", e.target.value)}
                min="0"
                max="100"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plazo de Pago (días)
              </label>
              <input
                type="number"
                value={settings.defaultPaymentTerms}
                onChange={(e) => handleChange("defaultPaymentTerms", e.target.value)}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  )
}

