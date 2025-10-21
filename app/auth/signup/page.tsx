import { redirect } from "next/navigation"
import Link from "next/link"
import { prismaServer as prisma } from "@/lib/prisma-server"
import bcrypt from "bcryptjs"

async function handleSignUp(formData: FormData) {
  "use server"

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  console.log("🔍 [SIGNUP] Inicio del registro")
  console.log("📧 Email:", email)
  console.log("👤 Nombre:", name)

  // ⚠️ IMPORTANTE: Validaciones fuera del try/catch
  // redirect() lanza un error NEXT_REDIRECT que debe propagarse
  if (!name || !email || !password || !confirmPassword) {
    console.log("❌ [SIGNUP] Campos faltantes")
    redirect("/auth/signup?error=MissingFields")
  }

  if (password !== confirmPassword) {
    console.log("❌ [SIGNUP] Contraseñas no coinciden")
    redirect("/auth/signup?error=PasswordMismatch")
  }

  if (password.length < 6) {
    console.log("❌ [SIGNUP] Contraseña muy corta")
    redirect("/auth/signup?error=PasswordTooShort")
  }

  // Lógica de base de datos dentro de try/catch
  let userId: string
  
  try {
    console.log("🔍 [SIGNUP] Verificando si usuario existe...")
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("❌ [SIGNUP] Usuario ya existe")
      redirect("/auth/signup?error=UserExists")
    }

    console.log("✅ [SIGNUP] Usuario no existe, continuando...")
    console.log("🏢 [SIGNUP] Buscando organización demo...")
    
    let organization = await prisma.organization.findFirst({
      where: { slug: "empresa-demo" }
    })

    if (!organization) {
      console.log("⚠️  [SIGNUP] Organización no existe, creando...")
      
      organization = await prisma.organization.create({
        data: {
          slug: "empresa-demo",
          name: "Empresa Demo S.A.",
          ruc: "123456789-1",
          dv: "1",
          email: "demo@empresa.com",
          phone: "+507 1234-5678",
          address: "Panamá, Panamá",
          hkaEnabled: true,
          maxUsers: 100,
          maxFolios: 10000,
          isActive: true,
          metadata: {
            theme: "light",
            timezone: "America/Panama",
            currency: "PAB",
            language: "es"
          }
        }
      })
      
      console.log("✅ [SIGNUP] Organización creada:", organization.id)
    } else {
      console.log("✅ [SIGNUP] Organización encontrada:", organization.id)
    }

    console.log("🔐 [SIGNUP] Hasheando contraseña...")
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log("👤 [SIGNUP] Creando usuario...")
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "USER",
        organizationId: organization.id,
        isActive: true
      }
    })

    userId = newUser.id
    console.log("✅ [SIGNUP] Usuario creado exitosamente:", userId)

  } catch (error: any) {
    // ⚠️ IMPORTANTE: Re-lanzar errores de redirect de Next.js
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      console.log("🔄 [SIGNUP] Redirect detectado, propagando...")
      throw error
    }
    
    // Error real de base de datos
    console.error("❌ [SIGNUP] Error en base de datos:")
    console.error("   Tipo:", error?.constructor?.name)
    console.error("   Mensaje:", error?.message)
    if (error?.stack) console.error("   Stack:", error.stack.substring(0, 200))
    
    redirect("/auth/signup?error=ServerError")
  }

  // ✅ Redirect SIEMPRE fuera del try/catch principal
  console.log("🔄 [SIGNUP] Redirigiendo a login...")
  redirect("/auth/signin?success=AccountCreated")
}

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const params = await searchParams
  const errorMessages = {
    MissingFields: "Todos los campos son obligatorios",
    PasswordMismatch: "Las contraseñas no coinciden",
    PasswordTooShort: "La contraseña debe tener al menos 6 caracteres",
    UserExists: "Este correo electrónico ya está registrado",
    ServerError: "Error en el servidor. Intenta de nuevo."
  }

  const error = params.error as keyof typeof errorMessages

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Regístrate en SAGO-FACTU
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {errorMessages[error] || "Error desconocido"}
                </h3>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" action={handleSignUp}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nombre completo"
              />
            </div>
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña (mínimo 6 caracteres)"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmar contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Registrarse
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
