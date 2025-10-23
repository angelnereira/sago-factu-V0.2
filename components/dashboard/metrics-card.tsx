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
  blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
  purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
  red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
}

export function MetricsCard({ title, value, icon: Icon, trend, color }: MetricsCardProps) {
  const hasTrend = trend !== undefined && trend !== 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          
          {hasTrend && (
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
              )}
              <span className={cn(
                "text-sm font-medium",
                trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {Math.abs(trend)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs mes anterior</span>
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

