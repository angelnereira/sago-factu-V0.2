"use client"

import { CheckCircle, Clock, XCircle, AlertTriangle, FileText } from "lucide-react"

interface SystemStatsProps {
  invoicesByStatus: {
    status: string
    count: number
  }[]
}

export function SystemStats({ invoicesByStatus }: SystemStatsProps) {
  const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
    DRAFT: {
      label: "Borrador",
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    PENDING: {
      label: "Pendiente",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    APPROVED: {
      label: "Aprobadas",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    REJECTED: {
      label: "Rechazadas",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    FAILED: {
      label: "Fallidas",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  }

  const total = invoicesByStatus.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Estado de Facturas</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} total</span>
      </div>

      <div className="space-y-4">
        {invoicesByStatus.map((item) => {
          const config = statusConfig[item.status] || {
            label: item.status,
            icon: FileText,
            color: "text-gray-600 dark:text-gray-400",
            bgColor: "bg-gray-100 dark:bg-gray-900/20",
          }
          const Icon = config.icon
          const percentage = total > 0 ? (item.count / total) * 100 : 0

          return (
            <div key={item.status} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 ${config.bgColor} rounded-lg`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.count.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${config.bgColor.replace("100", "500")}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {invoicesByStatus.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p className="text-sm">No hay facturas registradas</p>
        </div>
      )}
    </div>
  )
}

