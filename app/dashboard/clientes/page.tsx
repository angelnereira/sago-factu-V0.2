import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { ClientsList } from "@/components/clients/clients-list"
import { UserPlus } from "lucide-react"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
  }>
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const perPage = 20

  // Obtener clientes únicos desde las facturas
  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    select: {
      receiverRuc: true,
      receiverDv: true,
      receiverName: true,
      receiverEmail: true,
      receiverPhone: true,
      receiverAddress: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Agrupar por RUC para obtener clientes únicos
  const clientsMap = new Map()
  invoices.forEach(invoice => {
    const key = `${invoice.receiverRuc}-${invoice.receiverDv}`
    if (!clientsMap.has(key)) {
      clientsMap.set(key, {
        ruc: invoice.receiverRuc,
        dv: invoice.receiverDv,
        name: invoice.receiverName,
        email: invoice.receiverEmail,
        phone: invoice.receiverPhone,
        address: invoice.receiverAddress,
        lastInvoice: invoice.createdAt,
      })
    }
  })

  const allClients = Array.from(clientsMap.values())
  
  // Paginación
  const totalClients = allClients.length
  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage
  const clients = allClients.slice(startIndex, endIndex)
  const totalPages = Math.ceil(totalClients / perPage)

  // Contar facturas por cliente
  const clientsWithStats = await Promise.all(
    clients.map(async (client) => {
      const invoiceCount = await prisma.invoice.count({
        where: {
          organizationId,
          receiverRuc: client.ruc,
        },
      })

      const totalAmount = await prisma.invoice.aggregate({
        where: {
          organizationId,
          receiverRuc: client.ruc,
        },
        _sum: {
          total: true,
        },
      })

      return {
        ...client,
        invoiceCount,
        totalAmount: totalAmount._sum.total || 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-2">
            Gestiona la información de tus clientes
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <UserPlus className="h-5 w-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalClients}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalClients}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Este Mes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {clientsMap.size}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <UserPlus className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <ClientsList
        clients={clientsWithStats}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  )
}

