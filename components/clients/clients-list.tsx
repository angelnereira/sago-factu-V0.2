"use client"

import { useState } from "react"
import { Search, Mail, Phone, MapPin, FileText, ChevronLeft, ChevronRight, User } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface Client {
  id: string
  ruc: string | null
  dv: string | null
  name: string
  email: string | null
  phone: string | null
  address: string | null
  lastInvoice: Date
  invoiceCount: number
  totalAmount?: number
}

interface ClientsListProps {
  clients: Client[]
  currentPage: number
  totalPages: number
}

export function ClientsList({ clients, currentPage, totalPages }: ClientsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("q") || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (searchTerm) {
      params.set("q", searchTerm)
    } else {
      params.delete("q")
    }
    params.set("page", "1") // Resetear a página 1 al buscar
    router.push(`/dashboard/clientes?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("page", page.toString())
    router.push(`/dashboard/clientes?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUC o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors">
            Buscar
          </button>
        </div>
      </form>

      {/* Grid de clientes */}
      {clients.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No se encontraron clientes</h3>
          <p className="text-gray-500 dark:text-gray-400">Intenta con otra búsqueda o agrega un nuevo cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate" title={client.name}>
                    {client.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded font-mono border border-gray-200 dark:border-gray-600">
                      {client.ruc}{client.dv ? `-${client.dv}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-3 mb-5">
                {client.email ? (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
                    <Mail className="h-4 w-4 mr-2.5 text-gray-400 dark:text-gray-500" />
                    <span className="truncate">{client.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-400 italic">
                    <Mail className="h-4 w-4 mr-2.5 opacity-50" />
                    <span>Sin email registrado</span>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4 mr-2.5 text-gray-400 dark:text-gray-500" />
                    <span>{client.phone}</span>
                  </div>
                )}

                {client.address && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-2.5 text-gray-400 dark:text-gray-500" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>

              {/* Estadísticas */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Facturas Emitidas</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    {client.invoiceCount}
                  </p>
                </div>

                <div className="text-right">
                  <Link
                    href={`/dashboard/facturas?cliente=${client.ruc}`}
                    className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Ver Historial
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-4">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
