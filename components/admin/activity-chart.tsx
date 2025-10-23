"use client"

import { BarChart3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface ActivityChartProps {
  data: {
    month: string
    invoices: number
  }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Esperar a que el componente esté montado para evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Formatear mes para mostrar
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-")
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return {
      month: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
      invoices: item.invoices,
    }
  })

  // Definir colores según el tema (solo después de montar)
  const isDark = mounted && resolvedTheme === "dark"

  const colors = {
    grid: isDark ? "#374151" : "#e5e7eb",           // gray-700 : gray-200
    tick: isDark ? "#9ca3af" : "#6b7280",           // gray-400 : gray-500
    tickLine: isDark ? "#374151" : "#e5e7eb",       // gray-700 : gray-200
    tooltipBg: isDark ? "#1f2937" : "#fff",         // gray-800 : white
    tooltipBorder: isDark ? "#374151" : "#e5e7eb",  // gray-700 : gray-200
    tooltipLabel: isDark ? "#f3f4f6" : "#111827",   // gray-100 : gray-900
    tooltipItem: isDark ? "#818cf8" : "#6366f1",    // indigo-400 : indigo-600
    bar: isDark ? "#818cf8" : "#6366f1",            // indigo-400 : indigo-600
  }

  // Renderizar esqueleto antes de montar para evitar mismatch
  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actividad de Facturación</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Facturas emitidas en los últimos 6 meses</p>
          </div>
          <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 dark:text-gray-500">Cargando gráfico...</div>
        </div>
      </div>
    )
  }

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
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="month"
              tick={{ fill: colors.tick, fontSize: 12 }}
              tickLine={{ stroke: colors.tickLine }}
            />
            <YAxis
              tick={{ fill: colors.tick, fontSize: 12 }}
              tickLine={{ stroke: colors.tickLine }}
              axisLine={{ stroke: colors.tickLine }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: colors.tooltipLabel, fontWeight: 600 }}
              itemStyle={{ color: colors.tooltipItem }}
            />
            <Bar
              dataKey="invoices"
              fill={colors.bar}
              radius={[8, 8, 0, 0]}
              name="Facturas"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

