"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"

interface AuditFiltersProps {
  currentFilters: {
    action?: string
    entity?: string
    user?: string
  }
  actionStats: {
    action: string
    count: number
  }[]
  entityStats: {
    entity: string
    count: number
  }[]
}

export function AuditFilters({ currentFilters, actionStats, entityStats }: AuditFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // Reset to page 1
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(window.location.pathname)
  }

  const hasFilters = currentFilters.action || currentFilters.entity || currentFilters.user

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </button>
        )}
      </div>

      {/* User Search */}
      <div>
        <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Usuario
        </label>
        <input
          type="text"
          id="userSearch"
          placeholder="Email o ID"
          defaultValue={currentFilters.user}
          onChange={(e) => {
            const value = e.target.value
            setTimeout(() => applyFilter("user", value), 500) // Debounce
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Action Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Acción</label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <button
            onClick={() => applyFilter("action", "")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !currentFilters.action
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Todos</span>
              <span className="text-xs text-gray-500">
                {actionStats.reduce((sum, stat) => sum + stat.count, 0)}
              </span>
            </div>
          </button>
          {actionStats.map((stat) => (
            <button
              key={stat.action}
              onClick={() => applyFilter("action", stat.action)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentFilters.action === stat.action
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{formatAction(stat.action)}</span>
                <span className="text-xs text-gray-500">{stat.count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Entity Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Entidad</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <button
            onClick={() => applyFilter("entity", "")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !currentFilters.entity
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Todas</span>
              <span className="text-xs text-gray-500">
                {entityStats.reduce((sum, stat) => sum + stat.count, 0)}
              </span>
            </div>
          </button>
          {entityStats.map((stat) => (
            <button
              key={stat.entity}
              onClick={() => applyFilter("entity", stat.entity)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentFilters.entity === stat.entity
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{stat.entity}</span>
                <span className="text-xs text-gray-500">{stat.count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

