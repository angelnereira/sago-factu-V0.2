"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Ticket,
  FileText,
  Mail,
  Phone,
  Globe,
  MapPin,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { OrganizationModal } from "./organization-modal"

interface Organization {
  id: string
  name: string
  ruc: string | null
  dv: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo: string | null
  isActive: boolean
  createdAt: Date
  _count: {
    users: number
    invoices: number
  }
  folios: {
    assigned: number
    consumed: number
    available: number
  }
}

interface OrganizationsTableProps {
  organizations: Organization[]
}

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const router = useRouter()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = () => {
    setSelectedOrg(null)
    setShowModal(true)
  }

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org)
    setShowModal(true)
  }

  const handleDelete = async (orgId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta organización? Esta acción eliminará todos sus usuarios, folios y facturas.")) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar organización")
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (orgId: string, currentStatus: boolean) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al cambiar estado")
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Lista de Organizaciones
        </h2>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Organización
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {org.name}
                    </h3>
                    {org.ruc && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        RUC: {org.ruc}{org.dv ? `-${org.dv}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {org.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactiva
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                {org.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {org.email}
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {org.phone}
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-2 text-gray-400" />
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      {org.website}
                    </a>
                  </div>
                )}
                {org.address && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span>{org.address}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {org._count.users}
                  </p>
                  <p className="text-xs text-gray-500">Usuarios</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Ticket className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {org.folios.available}
                  </p>
                  <p className="text-xs text-gray-500">Folios Disp.</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {org._count.invoices}
                  </p>
                  <p className="text-xs text-gray-500">Facturas</p>
                </div>
              </div>

              {/* Folio Progress */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Consumo de Folios</span>
                  <span className="font-medium text-gray-900">
                    {org.folios.consumed} / {org.folios.assigned}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      org.folios.assigned > 0
                        ? (org.folios.consumed / org.folios.assigned) * 100 > 80
                          ? "bg-red-600"
                          : (org.folios.consumed / org.folios.assigned) * 100 > 50
                          ? "bg-yellow-600"
                          : "bg-green-600"
                        : "bg-gray-300"
                    }`}
                    style={{
                      width: `${
                        org.folios.assigned > 0
                          ? Math.min((org.folios.consumed / org.folios.assigned) * 100, 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 pt-2">
                Registrada: {format(new Date(org.createdAt), "dd MMM yyyy", { locale: es })}
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleToggleStatus(org.id, org.isActive)}
                disabled={isLoading}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                {org.isActive ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={() => handleEdit(org)}
                disabled={isLoading}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(org.id)}
                disabled={isLoading}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {organizations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay organizaciones registradas
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza creando tu primera organización
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Organización
          </button>
        </div>
      )}

      {/* Organization Modal */}
      <OrganizationModal
        organization={selectedOrg}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedOrg(null)
        }}
      />
    </div>
  )
}

