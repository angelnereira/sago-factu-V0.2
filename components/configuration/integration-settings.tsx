"use client"

import { useState } from "react"
import { Plug, Save, Eye, EyeOff, Key, Server, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface SystemConfig {
  id: string
  key: string
  value: string
  description: string | null
}

interface IntegrationSettingsProps {
  organizationId: string
  systemConfig: SystemConfig | null
}

export function IntegrationSettings({ organizationId, systemConfig }: IntegrationSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"success" | "error" | null>(null)

  const [settings, setSettings] = useState({
    hkaMode: "demo",
    hkaUsername: "",
    hkaPassword: "",
    hkaWsdlUrl: "https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl",
    hkaApiKey: "",
    autoRetry: true,
    maxRetryAttempts: "3",
    timeoutSeconds: "30",
  })

  const handleChange = (field: string, value: string | boolean) => {
    setSettings({ ...settings, [field]: value })
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)
    setError("")

    try {
      const response = await fetch("/api/configuration/test-hka-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wsdlUrl: settings.hkaWsdlUrl,
          username: settings.hkaUsername,
          password: settings.hkaPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setConnectionStatus("success")
        setSuccess("✅ Conexión exitosa con HKA")
      } else {
        setConnectionStatus("error")
        setError(data.error || "❌ Error al conectar con HKA")
      }
    } catch (err: any) {
      setConnectionStatus("error")
      setError("❌ Error de red: " + err.message)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/configuration/integration", {
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

      setSuccess("✅ Configuración de integración actualizada correctamente")
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
        <Plug className="h-6 w-6 text-indigo-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Integración con The Factory HKA
          </h2>
          <p className="text-sm text-gray-600">
            Configura las credenciales y parámetros de conexión con HKA
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

      {/* Connection Status */}
      {connectionStatus && (
        <div
          className={`border rounded-lg p-4 flex items-center justify-between ${
            connectionStatus === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            {connectionStatus === "success" ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <span
              className={`font-medium ${
                connectionStatus === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {connectionStatus === "success"
                ? "Conexión verificada correctamente"
                : "Error en la conexión"}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Modo de Operación */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Server className="h-5 w-5 mr-2 text-indigo-600" />
            Modo de Operación
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleChange("hkaMode", "demo")}
              className={`p-4 border-2 rounded-lg transition-all ${
                settings.hkaMode === "demo"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <p className="font-medium text-gray-900">Demo</p>
                <p className="text-xs text-gray-500 mt-1">
                  Para pruebas y desarrollo
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleChange("hkaMode", "production")}
              className={`p-4 border-2 rounded-lg transition-all ${
                settings.hkaMode === "production"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <p className="font-medium text-gray-900">Producción</p>
                <p className="text-xs text-gray-500 mt-1">
                  Facturación en vivo
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Credenciales */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Key className="h-5 w-5 mr-2 text-indigo-600" />
            Credenciales de HKA
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del WSDL
              </label>
              <input
                type="url"
                value={settings.hkaWsdlUrl}
                onChange={(e) => handleChange("hkaWsdlUrl", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={settings.hkaUsername}
                onChange={(e) => handleChange("hkaUsername", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={settings.hkaPassword}
                  onChange={(e) => handleChange("hkaPassword", e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key (Opcional)
              </label>
              <input
                type="password"
                value={settings.hkaApiKey}
                onChange={(e) => handleChange("hkaApiKey", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-50"
              disabled={testingConnection || !settings.hkaWsdlUrl || !settings.hkaUsername || !settings.hkaPassword}
            >
              {testingConnection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  Probando conexión...
                </>
              ) : (
                <>
                  <Plug className="h-4 w-4 mr-2" />
                  Probar Conexión
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuración Avanzada */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Configuración Avanzada
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Reintento automático
                </label>
                <p className="text-xs text-gray-500">
                  Reintentar automáticamente en caso de error temporal
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRetry}
                onChange={(e) => handleChange("autoRetry", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Reintentos
                </label>
                <input
                  type="number"
                  value={settings.maxRetryAttempts}
                  onChange={(e) => handleChange("maxRetryAttempts", e.target.value)}
                  min="1"
                  max="10"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (segundos)
                </label>
                <input
                  type="number"
                  value={settings.timeoutSeconds}
                  onChange={(e) => handleChange("timeoutSeconds", e.target.value)}
                  min="10"
                  max="120"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
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

