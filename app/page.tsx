"use client"

import Link from "next/link"
import Image from "next/image"
import { LoginFormWrapper } from "@/components/home/login-form-wrapper"
import { ThemeToggle } from "@/components/theme-toggle"
import { FileText, Users, Zap, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white/95 to-violet-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero */}
          <section className="max-w-xl mx-auto lg:mx-0">
            {/* Logo */}
            <div className="mb-8 flex justify-center lg:justify-start">
              <Image
                src="/sago-factu-logo.png"
                alt="SAGO FACTU - Sistema de Facturación Electrónica"
                width={300}
                height={300}
                priority
                className="w-48 h-auto sm:w-56 md:w-64 lg:w-72"
              />
            </div>

            {/* Título principal */}
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-tight text-violet-700 dark:text-violet-400 mb-4">
              Sistema de Facturación Electrónica
            </h1>

            {/* Descripción */}
            <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              Plataforma Multi-Tenant para Panamá. 
              Gestiona, distribuye y monitorea folios de facturación electrónica 
              de manera eficiente y segura.
            </p>

            {/* Features Grid */}
            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-4 group">
                <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-200 flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <strong className="block text-gray-800 dark:text-gray-100 font-semibold">Gestión de Folios</strong>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Administración eficiente de folios electrónicos
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-4 group">
                <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-200 flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <strong className="block text-gray-800 dark:text-gray-100 font-semibold">Multi-Tenant</strong>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Espacios aislados y seguros para cada organización
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-4 group">
                <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-200 flex-shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <strong className="block text-gray-800 dark:text-gray-100 font-semibold">Integración HKA</strong>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Conexión directa con The Factory HKA para certificación
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-4 group">
                <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-200 flex-shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <strong className="block text-gray-800 dark:text-gray-100 font-semibold">Reportes y Analytics</strong>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Monitoreo en tiempo real y reportes detallados
                  </span>
                </div>
              </li>
            </ul>

            {/* CTA Mobile */}
            <div className="mt-8 lg:hidden">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 border-2 border-violet-300 dark:border-violet-700 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
              >
                Crear Cuenta Nueva
              </Link>
            </div>
          </section>

          {/* Right Side - Login Form */}
          <section className="w-full">
            <LoginFormWrapper />
          </section>
        </div>

        {/* Botones Fixed Top Right - Theme Toggle + Registrarse */}
        <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
          {/* Theme Toggle Button - Visible on all screens */}
          <ThemeToggle />
          
          {/* Botón Registrarse - Hidden on mobile */}
          <Link
            href="/auth/signup"
            className="hidden lg:inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-violet-600 dark:bg-violet-700 rounded-lg shadow-sm hover:bg-violet-700 dark:hover:bg-violet-600 hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
          >
            Crear Cuenta
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto py-4 px-6 lg:px-12">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 SAGO-FACTU. Sistema de Facturación Electrónica para Panamá.
          </p>
        </div>
      </footer>
    </main>
  )
}
