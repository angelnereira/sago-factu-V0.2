import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FoliosMonitor } from "@/app/dashboard/components/FoliosMonitor"

export default async function FoliosPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-800 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
            Sin Organización Asignada
          </h2>
          <p className="text-red-600 dark:text-red-300">
            Tu usuario no tiene una organización configurada. Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Monitor de Folios
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Estado en tiempo real de tus folios de facturación electrónica en HKA
        </p>
      </div>

      {/* Monitor Principal */}
      <FoliosMonitor />

      {/* Nota informativa */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
        <p className="font-medium mb-1">Nota sobre la gestión de folios:</p>
        <p>
          Con la nueva integración HKA v2.0, los folios son gestionados centralizadamente en la nube de The Factory HKA.
          No es necesario realizar asignaciones manuales locales. El sistema consumirá automáticamente del saldo disponible.
        </p>
      </div>
    </div>
  )
}

