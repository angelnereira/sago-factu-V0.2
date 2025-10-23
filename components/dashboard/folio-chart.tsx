"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface FolioChartProps {
  organizationId: string
}

export function FolioChart({ organizationId }: FolioChartProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Datos de ejemplo - en producción vendrían de la API
  const data = [
    { name: 'Ene', disponibles: 400, usados: 240 },
    { name: 'Feb', disponibles: 300, usados: 139 },
    { name: 'Mar', disponibles: 200, usados: 980 },
    { name: 'Abr', disponibles: 278, usados: 390 },
    { name: 'May', disponibles: 189, usados: 480 },
    { name: 'Jun', disponibles: 239, usados: 380 },
  ]

  const isDark = mounted && resolvedTheme === "dark"

  const colors = {
    grid: isDark ? "#374151" : "#f0f0f0",
    axis: isDark ? "#9ca3af" : "#6b7280",
    tooltipBg: isDark ? "#1f2937" : "#fff",
    tooltipBorder: isDark ? "#374151" : "#e5e7eb",
    lineAvailable: isDark ? "#60a5fa" : "#3b82f6",  // blue-400 : blue-500
    lineUsed: isDark ? "#34d399" : "#10b981",        // emerald-400 : emerald-500
  }

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Consumo de Folios</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Últimos 6 meses</p>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 dark:text-gray-500">Cargando gráfico...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Consumo de Folios</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Últimos 6 meses</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis 
              dataKey="name" 
              stroke={colors.axis}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke={colors.axis}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: '8px',
                color: isDark ? '#f3f4f6' : '#111827',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="disponibles" 
              stroke={colors.lineAvailable}
              strokeWidth={2}
              name="Disponibles"
              dot={{ fill: colors.lineAvailable, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="usados" 
              stroke={colors.lineUsed}
              strokeWidth={2}
              name="Usados"
              dot={{ fill: colors.lineUsed, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Disponibles</span>
        </div>
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Usados</span>
        </div>
      </div>
    </div>
  )
}

