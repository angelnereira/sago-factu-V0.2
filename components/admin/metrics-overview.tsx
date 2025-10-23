"use client"

import { Building2, Users, FileText, Ticket, TrendingUp, DollarSign, CheckCircle, Clock } from "lucide-react"

interface MetricsOverviewProps {
  metrics: {
    totalOrganizations: number
    activeOrganizations: number
    totalUsers: number
    recentUsers: number
    totalInvoices: number
    recentInvoices: number
    totalFoliosAssigned: number
    totalFoliosConsumed: number
    totalFoliosAvailable: number
    estimatedRevenue: number
  }
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const cards = [
    {
      title: "Organizaciones",
      value: metrics.totalOrganizations,
      subtitle: `${metrics.activeOrganizations} activas`,
      icon: Building2,
      color: "indigo",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600",
    },
    {
      title: "Usuarios Totales",
      value: metrics.totalUsers,
      subtitle: `+${metrics.recentUsers} últimos 30 días`,
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      title: "Facturas Emitidas",
      value: metrics.totalInvoices.toLocaleString(),
      subtitle: `+${metrics.recentInvoices} últimos 30 días`,
      icon: FileText,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      title: "Folios Asignados",
      value: metrics.totalFoliosAssigned.toLocaleString(),
      subtitle: `${metrics.totalFoliosConsumed.toLocaleString()} consumidos`,
      icon: Ticket,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      title: "Folios Disponibles",
      value: metrics.totalFoliosAvailable.toLocaleString(),
      subtitle: `${((metrics.totalFoliosAvailable / metrics.totalFoliosAssigned) * 100 || 0).toFixed(1)}% del total`,
      icon: CheckCircle,
      color: "emerald",
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600",
    },
    {
      title: "Ingresos Estimados",
      value: `$${metrics.estimatedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Por venta de folios",
      icon: DollarSign,
      color: "amber",
      bgColor: "bg-amber-100",
      textColor: "text-amber-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{card.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.subtitle}</p>
              </div>
              <div className={`p-3 ${card.bgColor} dark:bg-opacity-20 rounded-lg`}>
                <Icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

