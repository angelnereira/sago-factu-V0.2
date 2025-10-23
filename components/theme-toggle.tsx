"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

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

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    if (theme === "light") {
      return <Sun className="h-5 w-5 text-amber-500" />
    } else if (theme === "dark") {
      return <Moon className="h-5 w-5 text-indigo-400" />
    } else {
      return <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getLabel = () => {
    if (theme === "light") return "Modo claro"
    if (theme === "dark") return "Modo oscuro"
    return "Modo sistema"
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label={`Cambiar tema. Actual: ${getLabel()}`}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  )
}

