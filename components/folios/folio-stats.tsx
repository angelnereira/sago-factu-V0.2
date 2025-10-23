import { Folder, CheckCircle, XCircle, Clock } from "lucide-react"

interface FolioStatsProps {
  total: number
  disponibles: number
  usados: number
  reservados: number
}

export function FolioStats({ total, disponibles, usados, reservados }: FolioStatsProps) {
  const porcentajeDisponible = total > 0 ? Math.round((disponibles / total) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Folios</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
          </div>
          <div className="flex items-center justify-center h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Disponibles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Disponibles</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{disponibles}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{porcentajeDisponible}% del total</p>
          </div>
          <div className="flex items-center justify-center h-12 w-12 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Usados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Usados</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{usados}</p>
          </div>
          <div className="flex items-center justify-center h-12 w-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <XCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      </div>

      {/* Reservados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Reservados</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{reservados}</p>
          </div>
          <div className="flex items-center justify-center h-12 w-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
