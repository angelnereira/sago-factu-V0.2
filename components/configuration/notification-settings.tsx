"use client"

import { useState } from "react"
import { Bell, Save, Mail, MessageSquare, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"

interface NotificationSettingsProps {
  organizationId: string
  userId: string
}

export function NotificationSettings({ organizationId, userId }: NotificationSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [settings, setSettings] = useState({
    emailNotifications: true,
    folioAlerts: true,
    invoiceStatusUpdates: true,
    weeklyReport: true,
    systemAnnouncements: true,
    emailAddress: "",
    smsNotifications: false,
    phoneNumber: "",
    webhookUrl: "",
    webhookEnabled: false,
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
      const response = await fetch("/api/configuration/notifications", {
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

      setSuccess("✅ Configuración de notificaciones actualizada correctamente")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Bell className="h-6 w-6 text-indigo-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración de Notificaciones
          </h2>
          <p className="text-sm text-gray-600">
            Personaliza cómo y cuándo recibes notificaciones
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-indigo-600" />
            Notificaciones por Email
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Email
              </label>
              <input
                type="email"
                value={settings.emailAddress}
                onChange={(e) => handleChange("emailAddress", e.target.value)}
                placeholder="notificaciones@empresa.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Activar notificaciones por email
                  </label>
                  <p className="text-xs text-gray-500">
                    Recibe todas las notificaciones en tu correo
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleChange("emailNotifications", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Alertas de folios bajos
                  </label>
                  <p className="text-xs text-gray-500">
                    Notificación cuando los folios estén por agotarse
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.folioAlerts}
                  onChange={(e) => handleChange("folioAlerts", e.target.checked)}
                  disabled={!settings.emailNotifications}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Actualizaciones de facturas
                  </label>
                  <p className="text-xs text-gray-500">
                    Notificación cuando cambia el estado de una factura
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.invoiceStatusUpdates}
                  onChange={(e) => handleChange("invoiceStatusUpdates", e.target.checked)}
                  disabled={!settings.emailNotifications}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Reporte semanal
                  </label>
                  <p className="text-xs text-gray-500">
                    Resumen semanal de facturación y actividad
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.weeklyReport}
                  onChange={(e) => handleChange("weeklyReport", e.target.checked)}
                  disabled={!settings.emailNotifications}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Anuncios del sistema
                  </label>
                  <p className="text-xs text-gray-500">
                    Actualizaciones y mantenimientos programados
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.systemAnnouncements}
                  onChange={(e) => handleChange("systemAnnouncements", e.target.checked)}
                  disabled={!settings.emailNotifications}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Smartphone className="h-5 w-5 mr-2 text-indigo-600" />
            Notificaciones por SMS
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Activar notificaciones por SMS
                </label>
                <p className="text-xs text-gray-500">
                  Recibe alertas críticas por mensaje de texto
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleChange("smsNotifications", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Teléfono
              </label>
              <input
                type="tel"
                value={settings.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="+507 6000-0000"
                disabled={!settings.smsNotifications}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Webhook Notifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
            Webhooks (Avanzado)
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Activar webhooks
                </label>
                <p className="text-xs text-gray-500">
                  Envía notificaciones a tu sistema externo
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.webhookEnabled}
                onChange={(e) => handleChange("webhookEnabled", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Webhook
              </label>
              <input
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => handleChange("webhookUrl", e.target.value)}
                placeholder="https://tu-servidor.com/webhook"
                disabled={!settings.webhookEnabled}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se enviarán notificaciones POST a esta URL con el formato JSON
              </p>
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

