"use client"

import { Building2, FileText, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

interface TopOrganizationsProps {
  organizations: {
    id: string
    name: string
    invoices: number
    users: number
  }[]
}

export function TopOrganizations({ organizations }: TopOrganizationsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Organizaciones</h3>
        <TrendingUp className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {organizations.map((org, index) => (
          <Link
            key={org.id}
            href={`/dashboard/admin/organizaciones`}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                <span className="text-lg font-bold text-indigo-600">#{index + 1}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{org.name}</h4>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <FileText className="h-3 w-3 mr-1" />
                    {org.invoices} facturas
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Users className="h-3 w-3 mr-1" />
                    {org.users} usuarios
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No hay organizaciones registradas</p>
        </div>
      )}

      {organizations.length > 0 && (
        <Link
          href="/dashboard/admin/organizaciones"
          className="block mt-4 text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Ver todas las organizaciones →
        </Link>
      )}
    </div>
  )
}

