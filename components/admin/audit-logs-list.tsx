"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react"
import Link from "next/link"

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  userId: string
  userEmail: string
  changes: string
  ip: string
  userAgent: string
  createdAt: Date
}

interface AuditLogsListProps {
  logs: AuditLog[]
  currentPage: number
  totalPages: number
  totalCount: number
}

export function AuditLogsList({ logs, currentPage, totalPages, totalCount }: AuditLogsListProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-100 text-green-800"
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-800"
    if (action.includes("DELETE")) return "bg-red-100 text-red-800"
    if (action.includes("ACTIVATE")) return "bg-green-100 text-green-800"
    if (action.includes("DEACTIVATE")) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Registros de Actividad
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mostrando {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, totalCount)} de {totalCount.toLocaleString()} registros
          </p>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Entidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {log.userEmail}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{log.userId.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                        log.action
                      )}`}
                    >
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.ip || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 inline-flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {logs.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay registros</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No se encontraron logs con los filtros aplicados.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Link
                href={`?page=${currentPage - 1}`}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Anterior
              </Link>
              <Link
                href={`?page=${currentPage + 1}`}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                  currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Siguiente
              </Link>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Página <span className="font-medium">{currentPage}</span> de{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`?page=${currentPage - 1}`}
                  className={`relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <Link
                  href={`?page=${currentPage + 1}`}
                  className={`relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                    currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedLog(null)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Detalles del Registro</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha/Hora</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedLog.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Usuario</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.userEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Acción</label>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                          selectedLog.action
                        )}`}
                      >
                        {formatAction(selectedLog.action)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Entidad</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.entity}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID de Entidad</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.entityId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dirección IP</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.ip || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <p className="mt-1 text-xs text-gray-700 break-all">
                    {selectedLog.userAgent || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Cambios</label>
                  <pre className="mt-1 p-4 bg-gray-50 rounded-lg text-xs text-gray-900 overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.changes || "{}"), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

