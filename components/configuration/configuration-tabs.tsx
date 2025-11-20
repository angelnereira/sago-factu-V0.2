"use client"

import { useState } from "react"
import { Building2, Users, FileText, Plug, Bell, Shield, UserCircle, Key } from "lucide-react"
import { OrganizationSettings } from "./organization-settings"
import { UsersManagement } from "./users-management"
import { InvoiceSettings } from "./invoice-settings"
import { IntegrationSettings } from "./integration-settings"
import { NotificationSettings } from "./notification-settings"
import { SecuritySettings } from "./security-settings"
import { ProfileSettings } from "./profile-settings"
import HKACredentialsForm from "@/components/simple/hka-credentials-form"

interface Organization {
  id: string
  name: string
  ruc: string | null
  dv: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo: string | null
  isActive: boolean
  metadata: any
  createdAt: Date
  updatedAt: Date
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: Date
  organizationId?: string
  organization?: {
    id: string
    name: string
    ruc: string | null
  } | null
  folioStats?: {
    assigned: number
    consumed: number
  }
  invoiceCount?: number
}

interface SystemConfig {
  id: string
  key: string
  value: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

interface FolioStats {
  totalAssigned: number
  totalConsumed: number
}

interface ConfigurationTabsProps {
  organization: Organization
  users: User[]
  organizations?: { id: string; name: string; ruc: string | null }[]
  systemConfig: SystemConfig | null
  folioStats: FolioStats
  userRole: string
  userId: string
  currentUser: {
    id: string
    name: string | null
    email: string
    phone: string | null
    language: string
    timezone: string
    emailNotifications: boolean
    ruc: string | null
    dv: string | null
  }
  isSuperAdmin?: boolean
}

type TabId =
  | "profile"
  | "organization"
  | "users"
  | "invoicing"
  | "integration"
  | "hkaCredentials"
  | "notifications"
  | "security"

interface Tab {
  id: TabId
  name: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[] // Si se especifica, solo visible para estos roles
}

const tabs: Tab[] = [
  {
    id: "profile",
    name: "Perfil",
    icon: UserCircle,
  },
  {
    id: "organization",
    name: "Organización",
    icon: Building2,
    roles: ["SUPER_ADMIN", "ORG_ADMIN"],
  },
  {
    id: "users",
    name: "Usuarios",
    icon: Users,
    roles: ["SUPER_ADMIN", "ORG_ADMIN"],
  },
  {
    id: "invoicing",
    name: "Facturación",
    icon: FileText,
    roles: ["SUPER_ADMIN", "ORG_ADMIN"],
  },
  {
    id: "integration",
    name: "Integración HKA",
    icon: Plug,
    roles: ["SUPER_ADMIN", "ORG_ADMIN"],
  },
  {
    id: "hkaCredentials",
    name: "Mis credenciales HKA",
    icon: Key,
  },
  {
    id: "notifications",
    name: "Notificaciones",
    icon: Bell,
  },
  {
    id: "security",
    name: "Seguridad",
    icon: Shield,
    roles: ["SUPER_ADMIN", "ORG_ADMIN"],
  },
]

export function ConfigurationTabs({
  organization,
  users,
  organizations = [],
  systemConfig,
  folioStats,
  userRole,
  userId,
  currentUser,
  isSuperAdmin = false,
}: ConfigurationTabsProps) {
  const visibleTabs = tabs.filter((tab) => {
    if (!tab.roles) return true
    return tab.roles.includes(userRole)
  })

  const defaultTabId = (visibleTabs[0]?.id ?? "profile") as TabId
  const [activeTab, setActiveTab] = useState<TabId>(defaultTabId)

  const ensureValidTab = (current: TabId): TabId => {
    const exists = visibleTabs.some((tab) => tab.id === current)
    return exists ? current : defaultTabId
  }

  const activeTabSafe = ensureValidTab(activeTab)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Tab Headers */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTabSafe === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTabSafe === "profile" && (
          <ProfileSettings
            user={currentUser}
            organizationName={organization?.name}
          />
        )}
        {activeTabSafe === "organization" && (
          <OrganizationSettings organization={organization} />
        )}
        {activeTabSafe === "users" && (
          <UsersManagement
            users={users}
            organizationId={organization.id}
            organizations={organizations}
            isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeTabSafe === "invoicing" && (
          <InvoiceSettings
            organizationId={organization.id}
            folioStats={folioStats}
          />
        )}
        {activeTabSafe === "integration" && (
          <IntegrationSettings
            organizationId={organization.id}
            systemConfig={systemConfig}
          />
        )}
        {activeTabSafe === "hkaCredentials" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Configuración personal de HKA
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Define tus credenciales de autenticación para ambiente Demo y Producción. Estas credenciales son
                privadas y se usan al enviar documentos a HKA.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <HKACredentialsForm />
            </div>
          </div>
        )}
        {activeTabSafe === "notifications" && (
          <NotificationSettings
            organizationId={organization.id}
            userId={userId}
          />
        )}
        {activeTabSafe === "security" && (
          <SecuritySettings organizationId={organization.id} />
        )}
      </div>
    </div>
  )
}

