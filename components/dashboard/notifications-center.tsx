"use client"

import { useState, useEffect } from "react"
import { Bell, X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: Date
}

export function NotificationsCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Cargar notificaciones
  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notifications?limit=10")
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar al abrir
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  // Marcar como leída
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      })
      
      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error al marcar como leída:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "ERROR":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Cargando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const NotificationContent = (
                    <div
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(notification.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )

                  if (notification.link) {
                    return (
                      <Link
                        key={notification.id}
                        href={notification.link}
                        onClick={() => setIsOpen(false)}
                      >
                        {NotificationContent}
                      </Link>
                    )
                  }

                  return (
                    <div key={notification.id}>
                      {NotificationContent}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <Link
                  href="/dashboard/notificaciones"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

