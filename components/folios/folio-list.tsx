import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Package, User } from "lucide-react"

interface FolioPool {
  id: string
  folioStart: string | null
  folioEnd: string | null
  totalFolios: number
  purchaseAmount: any
  createdAt: Date
}

interface FolioAssignment {
  id: string
  assignedAmount: number
  consumedAmount: number
  assignedAt: Date
  folioPool: {
    folioStart: string | null
    folioEnd: string | null
  }
  user?: {
    name: string | null
    email: string | null
  } | null | undefined
}

interface FolioListProps {
  pools: FolioPool[]
  assignments: FolioAssignment[]
}


export function FolioList({ pools, assignments }: FolioListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pools de Folios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pools de Folios</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">{pools.length} pools</span>
        </div>

        {pools.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay pools de folios</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map((pool) => (
              <div
                key={pool.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Folios {pool.folioStart} - {pool.folioEnd}
                  </span>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                  >
                    Activo
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Cantidad: {pool.totalFolios}</span>
                  <span>
                    {format(new Date(pool.createdAt), "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asignaciones de Folios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Folios Asignados</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">{assignments.length} asignaciones</span>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay folios asignados</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {assignments.map((assignment) => {
              const disponibles = assignment.assignedAmount - assignment.consumedAmount
              const porcentajeUsado = Math.round(
                (assignment.consumedAmount / assignment.assignedAmount) * 100
              )

              return (
                <div
                  key={assignment.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Rango: {assignment.folioPool.folioStart} - {assignment.folioPool.folioEnd}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        disponibles > 0 ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400" : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {disponibles} disponibles
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Asignados: {assignment.assignedAmount}</span>
                      <span>Usados: {assignment.consumedAmount} ({porcentajeUsado}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {assignment.user?.name || "Sin asignar"}
                      </span>
                      <span>
                        {format(new Date(assignment.assignedAt), "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
