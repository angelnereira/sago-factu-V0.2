"use client"

import { useState } from "react"
import Link from "next/link"
import { LoginFormWrapper } from "@/components/home/login-form-wrapper"

export default function HomePage() {
  const [isLoginMode] = useState(true) // Siempre mostrar login

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section with Login */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            {/* Header */}
            <nav className="relative flex items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <img 
                  src="/sago-factu-logo.png" 
                  alt="SAGO-FACTU - Sistema de Facturación Electrónica" 
                  className="h-16 w-auto sm:h-20"
                />
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md transition-all"
                >
                  Registrarse
                </Link>
              </div>
            </nav>

            {/* Main Content */}
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Side - Hero Text */}
                <div className="text-center lg:text-left">
                  {/* Logo principal grande */}
                  <div className="flex justify-center lg:justify-start mb-6">
                    <img 
                      src="/sago-factu-logo.png" 
                      alt="SAGO-FACTU" 
                      className="h-32 w-auto sm:h-40 md:h-48 lg:h-56"
                    />
                  </div>
                  
                  <h1 className="text-3xl tracking-tight font-bold text-indigo-600 sm:text-4xl md:text-5xl">
                    Sistema de Facturación Electrónica
                  </h1>
                  
                  <p className="mt-4 text-base text-gray-600 sm:mt-6 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-6 md:text-xl lg:mx-0">
                    Plataforma Multi-Tenant para Panamá. 
                    Gestiona, distribuye y monitorea folios de facturación electrónica 
                    de manera eficiente y segura.
                  </p>

                  {/* Mobile CTA */}
                  <div className="mt-5 sm:mt-8 lg:hidden">
                    <div className="flex flex-col space-y-3">
                      <Link
                        href="/auth/signup"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        Crear Cuenta
                      </Link>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="mt-10 grid grid-cols-2 gap-4 lg:gap-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-500 text-white">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Gestión de Folios</h3>
                        <p className="text-xs text-gray-600">Administración eficiente</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-500 text-white">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Multi-Tenant</h3>
                        <p className="text-xs text-gray-600">Espacios aislados</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-500 text-white">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Integración HKA</h3>
                        <p className="text-xs text-gray-600">Certificación directa</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-500 text-white">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Analytics</h3>
                        <p className="text-xs text-gray-600">Reportes detallados</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="hidden lg:block">
                  <LoginFormWrapper />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 SAGO-FACTU. Sistema de Facturación Electrónica para Panamá.
          </p>
        </div>
      </footer>
    </div>
  )
}
