import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { HkaMethodsPanel } from "@/components/hka/HkaMethodsPanel"

export default async function MetodosHkaPage() {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Métodos HKA</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Interfaz para los 9 métodos del Web Service de HKA
        </p>
      </div>

      {/* Panel de Métodos */}
      <HkaMethodsPanel />
    </div>
  )
}
