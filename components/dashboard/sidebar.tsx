"use client"

import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  Building2,
  ShieldCheck,
  Activity,
  Monitor,
  FileText,
  Plus,
  Send,
  List,
  Zap,
  HelpCircle
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  badge?: string // Badge opcional
}

interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

// Menú para usuarios estándar/enterprise
const defaultSidebarItems: SidebarItem[] = [
  { name: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { name: "Métodos HKA", href: "/dashboard/metodos-hka", icon: Activity },
  { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
]

// Menú organizado para SIMPLE_USER
const simpleSidebarSections: SidebarSection[] = [
  {
    title: "NAVEGACIÓN",
    items: [
      { name: "Dashboard", href: "/simple", icon: LayoutDashboard },
    ]
  },
  {
    title: "FACTURAS",
    items: [
      { name: "Mis Facturas", href: "/simple/facturas", icon: List },
      { name: "Crear Factura", href: "/simple/facturas/crear", icon: Plus, badge: "NUEVO" },
      { name: "Métodos HKA", href: "/dashboard/metodos-hka", icon: Zap },
    ]
  },
  {
    title: "CUENTA",
    items: [
      { name: "Configuración", href: "/simple/configuracion", icon: Settings },
    ]
  },
]

// Versión plana para compatibilidad (legacy)
const simpleSidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/simple", icon: LayoutDashboard },
  { name: "Mis Facturas", href: "/simple/facturas", icon: FileText },
  { name: "Crear Factura", href: "/simple/facturas/crear", icon: Plus },
  { name: "Métodos HKA", href: "/dashboard/metodos-hka", icon: Zap },
  { name: "Configuración", href: "/simple/configuracion", icon: Settings },
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
  const isSimpleUser = userRole === 'SIMPLE_USER'

  // Elegir items según rol
  const baseItems = isSimpleUser ? simpleSidebarItems : defaultSidebarItems

  // Filtrar items según rol declarado (para default)
  const visibleItems = baseItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

  const visibleAdminItems = isSimpleUser ? [] : adminItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-colors">
      <nav className="p-4 space-y-1">
        {/* Para SIMPLE_USER, mostrar con secciones */}
        {isSimpleUser ? (
          simpleSidebarSections.map((section) => (
            <div key={section.title} className="mb-6">
              {section.title && (
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-lg transition-colors relative group",
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                        )} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-indigo-600 text-white rounded-full flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          // Para usuarios estándar/enterprise
          visibleItems.map((item) => {
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
          })
        )}

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

