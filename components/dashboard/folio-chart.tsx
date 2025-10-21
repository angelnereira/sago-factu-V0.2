"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FolioChartProps {
  organizationId: string
}

export function FolioChart({ organizationId }: FolioChartProps) {
  // Datos de ejemplo - en producción vendrían de la API
  const data = [
    { name: 'Ene', disponibles: 400, usados: 240 },
    { name: 'Feb', disponibles: 300, usados: 139 },
    { name: 'Mar', disponibles: 200, usados: 980 },
    { name: 'Abr', disponibles: 278, usados: 390 },
    { name: 'May', disponibles: 189, usados: 480 },
    { name: 'Jun', disponibles: 239, usados: 380 },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Consumo de Folios</h2>
        <p className="text-sm text-gray-600 mt-1">Últimos 6 meses</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="disponibles" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Disponibles"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="usados" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Usados"
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className="h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Disponibles</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Usados</span>
        </div>
      </div>
    </div>
  )
}

