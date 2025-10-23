"use client"

import { useState } from "react"
import { User, Organization } from "@prisma/client"
import { MoreVertical, Edit, Trash2, Key, Check, X } from "lucide-react"
import { EditUserModal } from "./edit-user-modal"
import { DeleteUserModal } from "./delete-user-modal"
import { AssignFoliosModal } from "./assign-folios-modal"

type UserWithOrganization = User & {
  organization: {
    id: string
    name: string
    ruc: string | null
  } | null
}

interface UsersTableProps {
  users: UserWithOrganization[]
  organizations: { id: string; name: string; ruc: string | null }[]
}

export function UsersTable({ users, organizations }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithOrganization | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [assignFoliosModalOpen, setAssignFoliosModalOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800"
      case "ORG_ADMIN":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleEdit = (user: UserWithOrganization) => {
    setSelectedUser(user)
    setEditModalOpen(true)
    setActiveMenu(null)
  }

  const handleDelete = (user: UserWithOrganization) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
    setActiveMenu(null)
  }

  const handleAssignFolios = (user: UserWithOrganization) => {
    setSelectedUser(user)
    setAssignFoliosModalOpen(true)
    setActiveMenu(null)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organización
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Registro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.organization ? (
                      <div>
                        <div className="text-sm text-gray-900">{user.organization.name}</div>
                        {user.organization.ruc && (
                          <div className="text-xs text-gray-500">RUC: {user.organization.ruc}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sin organización</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="inline-flex items-center text-sm text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-sm text-red-600">
                        <X className="h-4 w-4 mr-1" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("es-PA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </button>

                      {activeMenu === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                              <button
                                onClick={() => handleEdit(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Usuario
                              </button>
                              <button
                                onClick={() => handleAssignFolios(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Asignar Folios
                              </button>
                              {user.role !== "SUPER_ADMIN" && (
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar Usuario
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedUser && (
        <>
          <EditUserModal
            user={selectedUser}
            organizations={organizations}
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedUser(null)
            }}
          />

          <DeleteUserModal
            user={selectedUser}
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false)
              setSelectedUser(null)
            }}
          />

          <AssignFoliosModal
            user={selectedUser}
            isOpen={assignFoliosModalOpen}
            onClose={() => {
              setAssignFoliosModalOpen(false)
              setSelectedUser(null)
            }}
          />
        </>
      )}
    </>
  )
}

