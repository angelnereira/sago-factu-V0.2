"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts"

interface SalesReportProps {
  data: Array<{
    month: string
    ventas: number
    facturas: number
  }>
}

export function SalesReport({ data }: SalesReportProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Ventas Mensuales</h2>
        <p className="text-sm text-gray-600 mt-1">Últimos 6 meses</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: '#6B7280' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: '#6B7280' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem'
            }}
            formatter={(value: any) => [`$${value.toFixed(2)}`, '']}
          />
          <Legend />
          <Bar 
            dataKey="ventas" 
            fill="#4F46E5" 
            name="Ventas ($)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Gráfico de facturas */}
      <div className="mt-8">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Facturas Emitidas</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="facturas" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 5 }}
              name="Facturas"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

