'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CertificateStatus {
  total: number
  active: number
  expiring: number
  expired: number
  averageDaysToExpiration: number
}

interface MonitoringData {
  status: CertificateStatus
  certificates: Array<{
    id: string
    name: string
    daysUntilExpiration: number
    isExpired: boolean
    expiringWarning: boolean
  }>
}

export function CertificateMonitoring() {
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMonitoring()
    // Refetch every 6 hours
    const interval = setInterval(fetchMonitoring, 6 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchMonitoring = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/certificates/monitoring')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al cargar monitoreo')
        return
      }

      setMonitoring(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar monitoreo'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cargando monitoreo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!monitoring) {
    return null
  }

  const { status, certificates } = monitoring

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Certificados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {status.total}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {status.active}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Por Vencer</p>
              <p className={`text-2xl font-bold mt-1 ${
                status.expiring > 0 ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {status.expiring}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencidos</p>
              <p className={`text-2xl font-bold mt-1 ${
                status.expired > 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {status.expired}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {status.expired > 0 && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-800">
              ⚠️ Tienes {status.expired} certificado(s) vencido(s). Carga uno nuevo para
              continuar firmando facturas.
            </p>
          </div>
        </div>
      )}

      {status.expiring > 0 && status.expired === 0 && (
        <div className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-800">
              ⏰ Tienes {status.expiring} certificado(s) próximo(s) a vencer en menos de
              30 días. Considera cargar uno nuevo pronto.
            </p>
          </div>
        </div>
      )}

      {status.expired === 0 && status.expiring === 0 && (
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-800">
              ✓ Todos tus certificados están en orden. No hay certificados por vencer en
              los próximos 30 días.
            </p>
          </div>
        </div>
      )}

      {/* Expiration Timeline */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Timeline de Vencimiento
          </h3>

          <div className="space-y-3">
            {certificates
              .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)
              .map((cert, index) => (
                <div key={cert.id} className="flex items-center gap-4">
                  <div className="w-12 text-center">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold ${
                        cert.isExpired
                          ? 'bg-red-100 text-red-700'
                          : cert.expiringWarning
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {cert.isExpired ? 'X' : cert.daysUntilExpiration}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {cert.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cert.isExpired
                        ? 'Vencido'
                        : `${cert.daysUntilExpiration} días restantes`}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cert.isExpired
                          ? 'w-full bg-red-500'
                          : cert.expiringWarning
                            ? 'w-4/5 bg-yellow-500'
                            : 'w-1/2 bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Average Days */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Promedio de Vigencia
        </h3>
        <p className="text-3xl font-bold text-blue-600">
          {status.averageDaysToExpiration}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          días promedio hasta vencimiento
        </p>
      </div>

      {/* Refresh Button */}
      <Button
        onClick={fetchMonitoring}
        variant="outline"
        className="w-full"
      >
        Actualizar Monitoreo
      </Button>
    </div>
  )
}
