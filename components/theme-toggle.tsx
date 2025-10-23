"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Prevenir hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors"
        disabled
      >
        <div className="h-5 w-5" />
      </button>
    )
  }

  // Usar resolvedTheme para obtener el tema real (resuelve 'system' a 'light' o 'dark')
  const currentTheme = resolvedTheme || theme

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark")
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label={currentTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={currentTheme === "dark" ? "Modo oscuro activo" : "Modo claro activo"}
    >
      {currentTheme === "dark" ? (
        <Moon className="h-5 w-5 text-indigo-400" />
      ) : (
        <Sun className="h-5 w-5 text-amber-500" />
      )}
    </button>
  )
}

