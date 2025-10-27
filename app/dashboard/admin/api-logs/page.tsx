import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ApiLogsViewer } from "@/components/admin/api-logs-viewer"

export default async function ApiLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    endpoint?: string
    method?: string
    statusCode?: string
    success?: string
    apiName?: string
    userId?: string
    organizationId?: string
    fromDate?: string
    toDate?: string
  }>
}) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  // Solo Super Admin puede ver estos logs
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  const params = await searchParams
  const page = parseInt(params.page || "1")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Logs de Llamadas API</h1>
        <p className="text-gray-600 mt-1">
          Registro completo de todas las llamadas a APIs con detalles técnicos
        </p>
      </div>

      {/* Vista de Logs */}
      <ApiLogsViewer 
        currentPage={page}
        filters={params}
      />
    </div>
  )
}

