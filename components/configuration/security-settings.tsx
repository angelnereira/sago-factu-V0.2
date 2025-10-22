"use client"

import { useState } from "react"
import { Shield, Save, Key, Lock, Clock, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface SecuritySettingsProps {
  organizationId: string
}

export function SecuritySettings({ organizationId }: SecuritySettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [settings, setSettings] = useState({
    enforcePasswordPolicy: true,
    minPasswordLength: "8",
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    passwordExpiration: "90",
    sessionTimeout: "60",
    maxLoginAttempts: "5",
    twoFactorAuth: false,
    ipWhitelist: "",
    auditLogging: true,
    encryptSensitiveData: true,
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
      const response = await fetch("/api/configuration/security", {
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

      setSuccess("✅ Configuración de seguridad actualizada correctamente")
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
        <Shield className="h-6 w-6 text-indigo-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración de Seguridad
          </h2>
          <p className="text-sm text-gray-600">
            Administra las políticas de seguridad y acceso
          </p>
        </div>
      </div>

      {/* Security Alert */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-yellow-800">
            Importante
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            Los cambios en la configuración de seguridad afectarán a todos los usuarios de la organización.
            Asegúrate de comunicar los cambios relevantes a tu equipo.
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
        {/* Password Policy */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Key className="h-5 w-5 mr-2 text-indigo-600" />
            Política de Contraseñas
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Aplicar política de contraseñas
                </label>
                <p className="text-xs text-gray-500">
                  Requiere contraseñas seguras para todos los usuarios
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enforcePasswordPolicy}
                onChange={(e) => handleChange("enforcePasswordPolicy", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitud mínima de contraseña
              </label>
              <input
                type="number"
                value={settings.minPasswordLength}
                onChange={(e) => handleChange("minPasswordLength", e.target.value)}
                min="6"
                max="32"
                disabled={!settings.enforcePasswordPolicy}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  Requiere caracteres especiales (@, #, $, etc.)
                </label>
                <input
                  type="checkbox"
                  checked={settings.requireSpecialChars}
                  onChange={(e) => handleChange("requireSpecialChars", e.target.checked)}
                  disabled={!settings.enforcePasswordPolicy}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  Requiere números
                </label>
                <input
                  type="checkbox"
                  checked={settings.requireNumbers}
                  onChange={(e) => handleChange("requireNumbers", e.target.checked)}
                  disabled={!settings.enforcePasswordPolicy}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  Requiere mayúsculas
                </label>
                <input
                  type="checkbox"
                  checked={settings.requireUppercase}
                  onChange={(e) => handleChange("requireUppercase", e.target.checked)}
                  disabled={!settings.enforcePasswordPolicy}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiración de contraseña (días)
              </label>
              <input
                type="number"
                value={settings.passwordExpiration}
                onChange={(e) => handleChange("passwordExpiration", e.target.value)}
                min="0"
                max="365"
                disabled={!settings.enforcePasswordPolicy}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                0 = nunca expira
              </p>
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-indigo-600" />
            Gestión de Sesiones
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de inactividad (minutos)
              </label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange("sessionTimeout", e.target.value)}
                min="5"
                max="1440"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                La sesión se cerrará automáticamente después de este tiempo de inactividad
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo de intentos de inicio de sesión
              </label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleChange("maxLoginAttempts", e.target.value)}
                min="3"
                max="10"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                La cuenta se bloqueará temporalmente después de este número de intentos fallidos
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Security */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Lock className="h-5 w-5 mr-2 text-indigo-600" />
            Seguridad Avanzada
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Autenticación de dos factores (2FA)
                </label>
                <p className="text-xs text-gray-500">
                  Requiere un código adicional en cada inicio de sesión
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => handleChange("twoFactorAuth", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Registro de auditoría
                </label>
                <p className="text-xs text-gray-500">
                  Registra todas las acciones críticas del sistema
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.auditLogging}
                onChange={(e) => handleChange("auditLogging", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Encriptar datos sensibles
                </label>
                <p className="text-xs text-gray-500">
                  Encripta información crítica en la base de datos
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.encryptSensitiveData}
                onChange={(e) => handleChange("encryptSensitiveData", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Whitelist de IPs (opcional)
              </label>
              <textarea
                value={settings.ipWhitelist}
                onChange={(e) => handleChange("ipWhitelist", e.target.value)}
                rows={3}
                placeholder="192.168.1.1&#10;10.0.0.0/24&#10;203.0.113.0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                Solo las IPs listadas podrán acceder al sistema. Deja vacío para permitir todas las IPs.
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

