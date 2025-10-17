import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"

async function handleSignIn(formData: FormData) {
  "use server"
  
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    })
    
    if (result?.error) {
      console.error("Error en login:", result.error)
      redirect("/auth/signin?error=InvalidCredentials")
      return
    }
    
    // Si no hay error, redirigir al dashboard
    redirect("/dashboard")
  } catch (error) {
    // Solo capturar errores que no sean redirecciones
    if (error instanceof Error && !error.message.includes("NEXT_REDIRECT")) {
      console.error("Error en login:", error)
      redirect("/auth/signin?error=InvalidCredentials")
    }
    // Si es una redirección, dejarla pasar
  }
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accede a tu cuenta de SAGO-FACTU
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={handleSignIn}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
