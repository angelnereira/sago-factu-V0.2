'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  Star,
  Calendar,
} from 'lucide-react'

interface Certificate {
  id: string
  name: string
  certificateSubject: string
  certificateIssuer: string
  validFrom: Date
  validTo: Date
  ruc?: string
  fingerprint: string
  isActive: boolean
  isDefault: boolean
  createdAt: Date
  daysUntilExpiration: number
  isExpired: boolean
  expiringWarning: boolean
}

interface ListResponse {
  success: boolean
  certificates: Certificate[]
}

export function CertificateList() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCertificates()

    // Listen for certificate updates
    const handleUpdate = () => fetchCertificates()
    window.addEventListener('certificatesUpdated', handleUpdate)

    return () => {
      window.removeEventListener('certificatesUpdated', handleUpdate)
    }
  }, [])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/certificates/upload')
      const data: ListResponse = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al cargar certificados')
        return
      }

      // Convert date strings to Date objects
      const certs = data.certificates.map((cert) => ({
        ...cert,
        validFrom: new Date(cert.validFrom),
        validTo: new Date(cert.validTo),
        createdAt: new Date(cert.createdAt),
      }))

      setCertificates(certs)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar certificados'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este certificado?')) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/certificates/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al eliminar certificado')
        return
      }

      setCertificates((prevs) => prevs.filter((c) => c.id !== id))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al eliminar certificado'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/certificates/${id}/default`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al actualizar certificado')
        return
      }

      fetchCertificates()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al actualizar certificado'
      )
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cargando certificados...</p>
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

  if (certificates.length === 0) {
    return (
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-sm text-blue-800">
            No hay certificados cargados. Carga uno para comenzar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="border rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{cert.name}</h3>
                  {cert.isDefault && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {cert.certificateSubject}
                </p>
              </div>

              <div className="flex gap-2">
                {!cert.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(cert.id)}
                    title="Usar como predeterminado"
                  >
                    <Star className="h-4 w-4 text-gray-400" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cert.id)}
                  disabled={deletingId === cert.id}
                  title="Eliminar certificado"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Vencimiento</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {cert.validTo.toLocaleDateString('es-PA')}
                </p>
              </div>

              <div>
                <p className="text-gray-600">Días restantes</p>
                <p
                  className={`font-medium ${
                    cert.isExpired
                      ? 'text-red-600'
                      : cert.expiringWarning
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {cert.isExpired ? (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Vencido
                    </span>
                  ) : cert.expiringWarning ? (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {cert.daysUntilExpiration} días
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {cert.daysUntilExpiration} días
                    </span>
                  )}
                </p>
              </div>

              {cert.ruc && (
                <div>
                  <p className="text-gray-600">RUC</p>
                  <p className="font-medium text-gray-900">{cert.ruc}</p>
                </div>
              )}

              <div>
                <p className="text-gray-600">Emisor</p>
                <p className="font-medium text-gray-900 truncate">
                  {cert.certificateIssuer}
                </p>
              </div>
            </div>

            {cert.expiringWarning && !cert.isExpired && (
              <div className="mt-3 flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-800">
                    Este certificado vence en {cert.daysUntilExpiration} días
                  </p>
                </div>
              </div>
            )}

            {cert.isExpired && (
              <div className="mt-3 flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800">
                    Este certificado ha vencido
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
