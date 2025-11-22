import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function SimpleInvoicesPage() {
  const session = await auth()
  if (!session?.user?.organizationId) return null

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      total: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      {/* Header con botón de crear */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mis Facturas</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {invoices.length === 0 ? "Aún no tienes facturas" : `${invoices.length} factura${invoices.length !== 1 ? 's' : ''} registrada${invoices.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/simple/facturas/crear">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
            <Plus className="h-5 w-5" />
            Nueva Factura
          </button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ¿Listo para emitir tu primera factura electrónica?
          </p>
          <Link href="/simple/facturas/crear">
            <button className="flex items-center gap-2 mx-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
              <Plus className="h-5 w-5" />
              Crear Factura
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {invoices.map((inv) => (
              <Link key={inv.id} href={`/simple/facturas/${inv.id}`}>
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {inv.invoiceNumber || `#${inv.id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {inv.customer?.name || "Sin cliente"}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                        inv.status === "CERTIFIED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : inv.status === "ERROR"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          : inv.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">${Number(inv.total).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(inv.createdAt).toLocaleDateString("es-PA")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
