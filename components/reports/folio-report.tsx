"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"
import { Package, CheckCircle, MinusCircle } from "lucide-react"

interface FolioReportProps {
  total: number
  disponibles: number
  usados: number
}

const COLORS = {
  disponibles: "#10B981",
  usados: "#EF4444",
  reservados: "#F59E0B",
}

export function FolioReport({ total, disponibles, usados }: FolioReportProps) {
  const data = [
    { name: "Disponibles", value: disponibles, color: COLORS.disponibles },
    { name: "Usados", value: usados, color: COLORS.usados },
  ]

  const porcentajeUsado = total > 0 ? Math.round((usados / total) * 100) : 0
  const porcentajeDisponible = total > 0 ? Math.round((disponibles / total) * 100) : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Consumo de Folios</h2>
        <p className="text-sm text-gray-600 mt-1">Distribución actual</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de pastel */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Estadísticas detalladas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Folios</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">{disponibles}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{porcentajeDisponible}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <MinusCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Usados</p>
                <p className="text-2xl font-bold text-gray-900">{usados}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">{porcentajeUsado}%</p>
            </div>
          </div>

          {/* Alertas */}
          {porcentajeDisponible < 20 && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm font-medium text-yellow-800">
                ⚠️ Alerta: Folios bajos
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Te quedan menos del 20% de folios disponibles. Considera comprar más.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

