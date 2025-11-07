"use client"

import { useState } from "react"
import { Building2, Users, FileText, Plug, Bell, Shield, PenTool } from "lucide-react"
import { OrganizationSettings } from "./organization-settings"
import { UsersManagement } from "./users-management"
import { InvoiceSettings } from "./invoice-settings"
import { IntegrationSettings } from "./integration-settings"
import { NotificationSettings } from "./notification-settings"
import { SecuritySettings } from "./security-settings"
import { CertificateManager } from "@/components/certificates/certificate-manager"
import { DigitalSignatureSettings } from "@/components/certificates/digital-signature-settings"

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
  isSuperAdmin?: boolean
  certificates?: {
    id: string
    subject: string
    issuer: string
    validFrom: string
    validUntil: string
    ruc: string
    dv: string
  }[]
  signatureConfig?: {
    signatureMode: "ORGANIZATION" | "PERSONAL"
    certificateId: string | null
    autoSign: boolean
    notifyOnExpiration: boolean
  } | null
  activeCertificate?: {
    id: string
    subject: string
    issuer: string
    validFrom: string
    validUntil: string
    ruc: string
    dv: string
  } | null
}

type TabId =
  | "organization"
  | "users"
  | "invoicing"
  | "integration"
  | "digitalSignature"
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
    id: "organization",
    name: "Organización",
    icon: Building2,
  },
  {
    id: "users",
    name: "Usuarios",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    id: "invoicing",
    name: "Facturación",
    icon: FileText,
  },
  {
    id: "integration",
    name: "Integración HKA",
    icon: Plug,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    id: "digitalSignature",
    name: "Firma digital",
    icon: PenTool,
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
    roles: ["SUPER_ADMIN", "ADMIN"],
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
  isSuperAdmin = false,
  certificates = [],
  signatureConfig = null,
  activeCertificate = null,
}: ConfigurationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("organization")

  // Filtrar tabs según rol
  const visibleTabs = tabs.filter((tab) => {
    if (!tab.roles) return true
    return tab.roles.includes(userRole)
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Tab Headers */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
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
        {activeTab === "organization" && (
          <OrganizationSettings organization={organization} />
        )}
        {activeTab === "users" && (
          <UsersManagement 
            users={users} 
            organizationId={organization.id}
            organizations={organizations}
            isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeTab === "invoicing" && (
          <InvoiceSettings
            organizationId={organization.id}
            folioStats={folioStats}
          />
        )}
        {activeTab === "integration" && (
          <IntegrationSettings
            organizationId={organization.id}
            systemConfig={systemConfig}
          />
        )}
        {activeTab === "digitalSignature" && (
          <div className="space-y-6">
            <CertificateManager organizationId={organization.id} currentCertificate={activeCertificate} />
            <DigitalSignatureSettings certificates={certificates} initialConfig={signatureConfig} />
          </div>
        )}
        {activeTab === "notifications" && (
          <NotificationSettings
            organizationId={organization.id}
            userId={userId}
          />
        )}
        {activeTab === "security" && (
          <SecuritySettings organizationId={organization.id} />
        )}
      </div>
    </div>
  )
}

