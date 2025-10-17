import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                ¡Bienvenido a SAGO-FACTU! 🎉
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Hola <strong>{session.user?.name}</strong>, has iniciado sesión correctamente.
              </p>
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                <p className="font-semibold">✅ Login exitoso</p>
                <p className="text-sm">
                  Email: {session.user?.email} | 
                  Rol: {session.user?.role} | 
                  Organización: {session.user?.organizationId}
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Próximos pasos:</h2>
                <ul className="text-left max-w-md mx-auto space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Sistema de autenticación funcionando
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-500 mr-2">⏳</span>
                    Dashboard principal (en desarrollo)
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-500 mr-2">⏳</span>
                    Gestión de folios
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-500 mr-2">⏳</span>
                    Emisión de facturas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}