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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Folios</p>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="flex items-center justify-center h-12 w-12 bg-blue-50 rounded-lg">
            <Folder className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Disponibles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Disponibles</p>
            <p className="text-3xl font-bold text-green-600">{disponibles}</p>
            <p className="text-xs text-gray-500 mt-1">{porcentajeDisponible}% del total</p>
          </div>
          <div className="flex items-center justify-center h-12 w-12 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Usados */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Usados</p>
            <p className="text-3xl font-bold text-gray-900">{usados}</p>
          </div>
          <div className="flex items-center justify-center h-12 w-12 bg-gray-50 rounded-lg">
            <XCircle className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Reservados */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Reservados</p>
            <p className="text-3xl font-bold text-orange-600">{reservados}</p>
          </div>
          <div className="flex items-center justify-center h-12 w-12 bg-orange-50 rounded-lg">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  )
}

