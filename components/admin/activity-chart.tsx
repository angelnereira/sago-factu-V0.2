"use client"

import { BarChart3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ActivityChartProps {
  data: {
    month: string
    invoices: number
  }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  // Formatear mes para mostrar
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-")
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return {
      month: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
      invoices: item.invoices,
    }
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actividad de Facturación</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Facturas emitidas en los últimos 6 meses</p>
        </div>
        <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={{ stroke: "#e5e7eb" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#111827", fontWeight: 600 }}
              itemStyle={{ color: "#6366f1" }}
            />
            <Bar
              dataKey="invoices"
              fill="#6366f1"
              radius={[8, 8, 0, 0]}
              name="Facturas"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

