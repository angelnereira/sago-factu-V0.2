import { redirect } from "next/navigation"
import { prismaServer as prisma } from "@/lib/prisma-server"
import bcrypt from "bcryptjs"

async function testSignUp(formData: FormData) {
  "use server"

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("🧪 [TEST-SIGNUP] Inicio")
  console.log("📧 Email:", email)
  console.log("👤 Nombre:", name)

  try {
    // 1. Verificar usuario existente
    console.log("1️⃣ Verificando usuario...")
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("❌ Usuario ya existe")
      return { error: "Usuario ya existe" }
    }
    console.log("✅ Usuario no existe")

    // 2. Buscar organización
    console.log("2️⃣ Buscando organización...")
    let organization = await prisma.organization.findFirst({
      where: { slug: "empresa-demo" }
    })

    if (!organization) {
      console.log("⚠️  Creando organización...")
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
      console.log("✅ Organización creada")
    } else {
      console.log("✅ Organización encontrada")
    }

    // 3. Hash password
    console.log("3️⃣ Hasheando password...")
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log("✅ Password hasheado")

    // 4. Crear usuario
    console.log("4️⃣ Creando usuario...")
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
    console.log("✅ Usuario creado:", newUser.id)

    // 5. Redirigir
    console.log("5️⃣ Redirigiendo...")
    redirect("/auth/signin?success=AccountCreated")

  } catch (error: any) {
    console.error("❌ ERROR COMPLETO:")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensaje:", error.message)
    console.error("Stack:", error.stack)
    
    if (error.code) console.error("Code:", error.code)
    if (error.meta) console.error("Meta:", error.meta)
    
    return { 
      error: error.message,
      type: error.constructor.name,
      code: error.code
    }
  }
}

export default function TestSignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🧪 Test de Registro
        </h1>
        
        <form action={testSignUp} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue="Usuario Test"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (usa uno único cada vez)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={`test${Date.now()}@ejemplo.com`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="password123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            🧪 Probar Registro
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>📝 Instrucciones:</strong>
          </p>
          <ol className="text-sm text-yellow-700 mt-2 list-decimal list-inside space-y-1">
            <li>Llena el formulario</li>
            <li>Haz clic en "Probar Registro"</li>
            <li>Revisa la terminal del servidor para ver los logs</li>
            <li>Si hay error, aparecerá en los logs</li>
          </ol>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/auth/signup" 
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Volver al formulario real
          </a>
        </div>
      </div>
    </div>
  )
}

