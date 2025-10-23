"use client"

import { LogOut, Settings, User } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { NotificationsCenter } from "./notifications-center"

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <img 
              src="/sago-factu-logo.png" 
              alt="SAGO-FACTU" 
              className="h-10 w-auto"
            />
            <span className="text-sm text-gray-500 hidden md:block">
              Sistema de Facturación Electrónica
            </span>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <NotificationsCenter />

            {/* Usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-center h-8 w-8 bg-indigo-600 text-white rounded-full">
                  <User className="h-5 w-5" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role || "USER"}
                  </p>
                </div>
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                  
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

