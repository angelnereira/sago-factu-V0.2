import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InvoiceForm } from '@/components/invoices/invoice-form'

/**
 * Página: Crear Factura
 * Ruta: /simple/facturas/crear
 *
 * Proporciona un flujo completo para:
 * 1. Crear factura manualmente o importar desde archivo
 * 2. Auto-completar datos desde Excel/XML
 * 3. Validar en tiempo real
 * 4. Enviar a HKA en formato SOAP correcto
 * 5. Recepcionar respuesta (CUFE, QR, PDF)
 * 6. Guardar en BD clasificada por código de respuesta
 */
export default async function CreateInvoicePage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  const userId = session.user.id
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Crear Factura Electrónica
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Emite facturas electrónicas autorizadas por HKA. Puedes crear manualmente o importar desde Excel/XML.
        </p>
      </div>

      {/* Main Form */}
      <InvoiceForm organizationId={organizationId} userId={userId} />
    </div>
  )
}
