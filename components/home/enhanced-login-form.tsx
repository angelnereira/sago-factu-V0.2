"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

// Schema de validación
const loginSchema = z.object({
  email: z.string().email("Introduce un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>

interface EnhancedLoginFormProps {
  successMessage?: string
}

export function EnhancedLoginForm({ successMessage }: EnhancedLoginFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError("")

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setServerError("Credenciales incorrectas. Verifica email y contraseña.")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setServerError("Error al iniciar sesión. Por favor, intenta de nuevo.")
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-card hover:shadow-card-hover transition-shadow duration-300 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Iniciar Sesión</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Accede a tu cuenta de SAGO-FACTU</p>
        </div>

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 border border-green-200" role="alert">
            <p className="text-sm text-green-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {successMessage}
            </p>
          </div>
        )}

        {/* Error del servidor */}
        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 border border-red-200" role="alert">
            <p className="text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {serverError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
              className={`
                block w-full px-4 py-3 text-lg rounded-lg border shadow-sm
                transition-all duration-150 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:border-transparent
                ${errors.email ? "border-red-300 bg-red-50 dark:border-red-500 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"}
                hover:border-gray-400 dark:hover:border-gray-500
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-500
              `}
              placeholder="tu@email.com"
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : "password-hint"}
                {...register("password")}
                className={`
                  block w-full px-4 py-3 pr-12 text-lg rounded-lg border shadow-sm
                  transition-all duration-150 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:border-transparent
                  ${errors.password ? "border-red-300 bg-red-50 dark:border-red-500 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"}
                  hover:border-gray-400 dark:hover:border-gray-500
                  text-gray-900 dark:text-gray-100
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                `}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 rounded transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {errors.password.message}
              </p>
            )}
            {!errors.password && (
              <p id="password-hint" className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {/* Recordarme y ¿Olvidaste contraseña? */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-violet-600 focus:ring-violet-400 border-gray-300 dark:border-gray-600 rounded transition-colors cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Recordarme
              </label>
            </div>

            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 rounded px-1"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg shadow-sm text-base font-medium text-white
              transition-all duration-150 ease-in-out
              ${
                isSubmitting
                  ? "bg-violet-400 dark:bg-violet-500 cursor-not-allowed"
                  : "bg-violet-600 dark:bg-violet-700 hover:bg-violet-700 dark:hover:bg-violet-600 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
              }
              focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">¿No tienes cuenta?</span>
            </div>
          </div>

          {/* Botón Registrarse */}
          <Link
            href="/auth/signup"
            className="w-full flex items-center justify-center py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 transition-all duration-150"
          >
            Crear una cuenta
          </Link>
        </form>

        {/* Microcopy de confianza */}
        <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
          Al iniciar sesión, aceptas nuestros{" "}
          <Link href="/terms" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 underline">
            términos y condiciones
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

