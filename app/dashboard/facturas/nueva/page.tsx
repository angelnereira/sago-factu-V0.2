import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InvoiceForm } from "@/components/invoices/invoice-form"

export default async function NewInvoicePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const organizationId = session.user.organizationId

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario sin organización asignada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Factura</h1>
        <p className="text-gray-600 mt-2">
          Complete los datos para emitir una nueva factura electrónica
        </p>
      </div>

      {/* Formulario */}
      <InvoiceForm organizationId={organizationId} userId={session.user.id} />
    </div>
  )
}

