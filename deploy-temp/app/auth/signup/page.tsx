import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registrarse
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Crea tu cuenta en SAGO-FACTU
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Para registrarse, contacta al administrador del sistema.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              O usa una de las cuentas de prueba:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500">
                <strong>Super Admin:</strong> admin@sagofactu.com
              </p>
              <p className="text-xs text-gray-500">
                <strong>Usuario Demo:</strong> usuario@empresa.com
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <Link
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
