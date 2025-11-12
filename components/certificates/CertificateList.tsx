"use client"

import { useCallback, useEffect, useState } from "react"
import { Shield, Calendar, CheckCircle2, AlertTriangle } from "lucide-react"

interface CertificateSummary {
  id: string
  ruc: string
  issuer: string
  subject: string
  serialNumber: string
  validFrom: string
  validTo: string
  uploadedAt: string
  lastUsedAt: string | null
  isActive: boolean
  daysUntilExpiration: number
  certificateThumbprint?: string | null
}

export function CertificateList({ refreshToken }: { refreshToken?: number }) {
  const [certificates, setCertificates] = useState<CertificateSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCertificates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/certificates")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudieron obtener los certificados")
      }

      setCertificates(data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Error inesperado")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCertificates()
  }, [fetchCertificates, refreshToken])

  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        Cargando certificados...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-8 text-center">
        <Shield className="mb-3 h-12 w-12 text-neutral-400" />
        <p className="text-sm text-neutral-500">Todavía no se han configurado certificados digitales.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {certificates.map((certificate) => (
        <article
          key={certificate.id}
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-neutral-900">RUC {certificate.ruc}</h3>
              {certificate.isActive ? (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3 w-3" /> Activo
                </span>
              ) : (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  Inactivo
                </span>
              )}
            </div>
          </div>

          <p className="mt-2 text-sm text-neutral-600">{certificate.subject}</p>
          <p className="mt-1 text-xs text-neutral-500">Emisor: {certificate.issuer}</p>
          {certificate.certificateThumbprint && (
            <p className="mt-1 text-xs text-neutral-400">Thumbprint: {certificate.certificateThumbprint}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Vigencia: {new Date(certificate.validFrom).toLocaleDateString()} -{" "}
              {new Date(certificate.validTo).toLocaleDateString()}
            </span>
            <span>Serial: {certificate.serialNumber}</span>
            {certificate.lastUsedAt && (
              <span>Último uso: {new Date(certificate.lastUsedAt).toLocaleString()}</span>
            )}
          </div>

          {certificate.daysUntilExpiration < 30 && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              Expira en {certificate.daysUntilExpiration} días. Renueva el certificado para evitar interrupciones.
            </div>
          )}
        </article>
      ))}
    </div>
  )
}


