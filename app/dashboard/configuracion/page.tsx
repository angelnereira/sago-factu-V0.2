import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { HkaCredentialsForm } from "@/app/settings/components/HkaCredentialsForm"
import { ENDPOINTS } from "@/lib/hka/constants/endpoints"
import { getHkaCredentials } from "@/app/actions/settings/get-hka-credentials.action"

export default async function ConfigurationPage() {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/")
  }

  // Cargar credenciales guardadas
  const credentialsResult = await getHkaCredentials()
  const initialData = credentialsResult.success && credentialsResult.data
    ? credentialsResult.data
    : undefined

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración HKA</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configura tus credenciales para conectar con la API de HKA
          </p>
        </div>
      </div>

      {/* Credenciales HKA */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Credenciales de Autenticación
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Estas credenciales se envían en cada llamada SOAP a los métodos de HKA.
            Obtén tus tokens desde el portal de The Factory HKA.
          </p>
        </div>

        <HkaCredentialsForm initialData={initialData} />
      </div>

      {/* Información sobre los endpoints */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
          Endpoints Configurados
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <p><strong>Demo:</strong> {ENDPOINTS.DEMO.SOAP.replace('?wsdl', '')}</p>
          <p><strong>Producción:</strong> {ENDPOINTS.PROD.SOAP.replace('?wsdl', '')}</p>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
          Los endpoints se actualizan automáticamente desde la configuración central del sistema.
        </p>
      </div>
    </div>
  )
}
