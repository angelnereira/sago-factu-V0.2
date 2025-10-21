import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: number // Porcentaje de cambio (positivo o negativo)
  color: "blue" | "green" | "purple" | "orange" | "red"
}

const colorClasses = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
}

export function MetricsCard({ title, value, icon: Icon, trend, color }: MetricsCardProps) {
  const hasTrend = trend !== undefined && trend !== 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          
          {hasTrend && (
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={cn(
                "text-sm font-medium",
                trend > 0 ? "text-green-600" : "text-red-600"
              )}>
                {Math.abs(trend)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>

        <div className={cn(
          "flex items-center justify-center h-12 w-12 rounded-lg",
          colorClasses[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

