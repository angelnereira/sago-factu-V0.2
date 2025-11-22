import { prismaServer as prisma } from '@/lib/prisma-server';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Plus, Settings, FileText, Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default async function SimpleDashboard() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true }
  });

  if (user?.organization?.plan !== 'SIMPLE') {
    return null;
  }

  // Obtener facturas recientes
  const recentInvoices = await prisma.invoice.findMany({
    where: { organizationId: user.organizationId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      total: true,
      createdAt: true,
      customer: {
        select: { name: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bienvenido a SAGO-FACTU Simple
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Envía tus facturas a The Factory HKA de manera rápida y sencilla
        </p>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/simple/facturas/crear" className="group">
          <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-600 transition-colors cursor-pointer">
            <Plus className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Nueva Factura
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Crear y enviar una nueva factura electrónica
            </p>
          </div>
        </Link>

        <Link href="/simple/configuracion" className="group">
          <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-600 transition-colors">
            <Settings className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Configuración HKA
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestionar credenciales y configuración
            </p>
          </div>
        </Link>
      </div>

      {/* Facturas Recientes */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Facturas Recientes
        </h3>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No has creado ninguna factura aún
            </p>
            <Link href="/simple/facturas/crear">
              <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Crear mi primera factura
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`}
                    </p>
                    {invoice.status === 'CERTIFIED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Emitida
                      </span>
                    )}
                    {invoice.status === 'ERROR' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" /> Error
                      </span>
                    )}
                    {(invoice.status === 'DRAFT' || invoice.status === 'QUEUED') && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        <Clock className="w-3 h-3 mr-1" /> Borrador
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {invoice.customer?.name || 'Cliente General'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      ${Number(invoice.total).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(invoice.createdAt).toLocaleDateString('es-PA')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {invoice.status === 'CERTIFIED' && (
                      <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="Descargar PDF">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <Link href={`/simple/facturas/${invoice.id}`}>
                      <button className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-900">
                        Ver Detalles
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consulta Rápida */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Consultar Factura
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Busca una factura por su número CAFE o folio
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}

