"use client"

import { Suspense } from "react"
import { LoginForm } from "./login-form"

export function LoginFormWrapper() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Cargando...</h2>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

