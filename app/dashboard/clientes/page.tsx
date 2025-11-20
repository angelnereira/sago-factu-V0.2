import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { ClientsList } from "@/components/clients/clients-list"
import { UserPlus, Users } from "lucide-react"
import Link from "next/link"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    q?: string
  }>
}) {
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

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const query = params.q || ""
  const perPage = 20

  // Construir filtro de búsqueda
  const whereClause = {
    organizationId,
    isActive: true,
    ...(query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { ruc: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
      ]
    } : {})
  }

  // Obtener total de clientes para paginación
  const totalClients = await prisma.customer.count({
    where: whereClause
  })

  // Obtener clientes paginados
  const customers = await prisma.customer.findMany({
    where: whereClause,
    orderBy: {
      updatedAt: "desc",
    },
    skip: (page - 1) * perPage,
    take: perPage,
    include: {
      _count: {
        select: { invoices: true }
      }
    }
  })

  // Calcular estadísticas generales
  const activeClientsCount = await prisma.customer.count({
    where: { organizationId, isActive: true }
  })

  // Mapear a la estructura que espera el componente (o actualizar el componente)
  // Por ahora adaptamos los datos para mantener compatibilidad con ClientsList existente
  // pero idealmente deberíamos refactorizar ClientsList también.
  const formattedClients = customers.map(c => ({
    id: c.id,
    ruc: c.ruc,
    dv: c.dv,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    lastInvoice: c.updatedAt, // Usamos updatedAt como proxy si no hay facturas recientes
    invoiceCount: c._count.invoices,
    totalAmount: 0 // Calcular esto es costoso en tiempo real, lo dejamos en 0 o lo quitamos
  }))

  const totalPages = Math.ceil(totalClients / perPage)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Directorio de Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona tus clientes para facturación electrónica
          </p>
        </div>
        <Link
          href="/dashboard/clientes/nuevo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <UserPlus className="h-5 w-5" />
          <span>Nuevo Cliente</span>
        </Link>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clientes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{activeClientsCount}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <ClientsList
        clients={formattedClients}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  )
}

