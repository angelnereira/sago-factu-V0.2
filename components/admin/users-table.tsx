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
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
      case "ORG_ADMIN":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
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
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Organización
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha Registro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {user.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.organization ? (
                      <div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{user.organization.name}</div>
                        {user.organization.ruc && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">RUC: {user.organization.ruc}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">Sin organización</span>
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
                      <span className="inline-flex items-center text-sm text-green-600 dark:text-green-400">
                        <Check className="h-4 w-4 mr-1" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-sm text-red-600 dark:text-red-400">
                        <X className="h-4 w-4 mr-1" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </button>

                      {activeMenu === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-20 border border-gray-200 dark:border-gray-700">
                            <div className="py-1">
                              <button
                                onClick={() => handleEdit(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Usuario
                              </button>
                              <button
                                onClick={() => handleAssignFolios(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Asignar Folios
                              </button>
                              {user.role !== "SUPER_ADMIN" && (
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

