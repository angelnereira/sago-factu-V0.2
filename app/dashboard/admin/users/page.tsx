import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { UsersTable } from "@/components/admin/users-table"
import { CreateUserButton } from "@/components/admin/create-user-button"
import { Users, UserPlus, Search } from "lucide-react"

export default async function AdminUsersPage() {
  const session = await auth()

  // Verificar que el usuario sea Super Admin
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  // Obtener todos los usuarios con sus organizaciones
  const users = await prisma.user.findMany({
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          ruc: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Obtener todas las organizaciones para el formulario de crear usuario
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      ruc: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  // Estadísticas
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive).length
  const superAdmins = users.filter(u => u.role === "SUPER_ADMIN").length
  const admins = users.filter(u => u.role === "ADMIN").length
  const normalUsers = users.filter(u => u.role === "USER").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="mt-2 text-gray-600">
            Administra todos los usuarios del sistema
          </p>
        </div>
        <CreateUserButton organizations={organizations} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div>
            <p className="text-xs text-gray-600">Activos</p>
            <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div>
            <p className="text-xs text-gray-600">Super Admins</p>
            <p className="text-2xl font-bold text-red-600">{superAdmins}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div>
            <p className="text-xs text-gray-600">Admins</p>
            <p className="text-2xl font-bold text-purple-600">{admins}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div>
            <p className="text-xs text-gray-600">Usuarios</p>
            <p className="text-2xl font-bold text-blue-600">{normalUsers}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Todos los Usuarios ({totalUsers})
            </h2>
            {/* Search Bar (opcional para futuro) */}
          </div>
        </div>
        
        <UsersTable users={users} organizations={organizations} />
      </div>
    </div>
  )
}

