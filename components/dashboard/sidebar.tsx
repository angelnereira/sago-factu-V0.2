"use client"

import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Users, 
  Settings,
  BarChart3,
  Folder,
  Building2,
  ShieldCheck,
  Activity,
  Monitor
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[] // Si se especifica, solo visible para estos roles
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  // Accesos para usuarios del Plan Simple
  {
    name: "Modo Simple",
    href: "/simple",
    icon: LayoutDashboard,
    roles: ["SIMPLE_USER"],
  },
  {
    name: "Configurar HKA",
    href: "/simple/configuracion",
    icon: Settings,
    roles: ["SIMPLE_USER"],
  },
  {
    name: "Folios",
    href: "/dashboard/folios",
    icon: Folder,
  },
  {
    name: "Facturas",
    href: "/dashboard/facturas",
    icon: FileText,
  },
  {
    name: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    name: "Reportes",
    href: "/dashboard/reportes",
    icon: BarChart3,
  },
  {
    name: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ORG_ADMIN"],
  },
]

const adminItems: SidebarItem[] = [
  {
    name: "Panel Admin",
    href: "/dashboard/admin",
    icon: ShieldCheck,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Organizaciones",
    href: "/dashboard/admin/organizaciones",
    icon: Building2,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Usuarios",
    href: "/dashboard/admin/users",
    icon: Users,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Métricas",
    href: "/dashboard/admin/metricas",
    icon: BarChart3,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Auditoría",
    href: "/dashboard/admin/auditoria",
    icon: Activity,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Logs API",
    href: "/dashboard/admin/api-logs",
    icon: Activity,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Monitoreo API",
    href: "/dashboard/admin/monitores",
    icon: Monitor,
    roles: ["SUPER_ADMIN"],
  },
]

interface DashboardSidebarProps {
  userRole: string
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const pathname = usePathname()

  // Filtrar items según rol
  const visibleItems = sidebarItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

  const visibleAdminItems = adminItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-colors">
      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
              )} />
              <span>{item.name}</span>
            </Link>
          )
        })}

        {/* Sección de Administración (Solo SUPER_ADMIN) */}
        {visibleAdminItems.length > 0 && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Administración
            </p>
            {visibleAdminItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"
                  )} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Footer del sidebar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p className="font-medium">SAGO-FACTU</p>
          <p>v0.2.0</p>
        </div>
      </div>
    </aside>
  )
}

