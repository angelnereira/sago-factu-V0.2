"use client"

import { LogOut, Settings, User } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { NotificationsCenter } from "./notifications-center"
import { ThemeToggle } from "@/components/theme-toggle"
import { config } from "@/lib/config"

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
    // Primero hacer signOut
    await signOut({ redirect: false })
    // Luego redirigir manualmente a la URL de producción
    window.location.href = 'https://sago-factu-v0-2.vercel.app/'
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <img 
              src="/sago-factu-logo.png" 
              alt="SAGO-FACTU" 
              className="h-10 w-auto"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              Sistema de Facturación Electrónica
            </span>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center space-x-4">
            {/* Toggle de tema */}
            <ThemeToggle />
            
            {/* Notificaciones */}
            <NotificationsCenter />

            {/* Usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-center h-8 w-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full">
                  <User className="h-5 w-5" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.name || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.role || "USER"}
                  </p>
                </div>
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
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

