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

interface CertificateResponse {
  organization: CertificateSummary[]
  personal: CertificateSummary[]
}

export function CertificateList({ refreshToken }: { refreshToken?: number }) {
  const [certificates, setCertificates] = useState<CertificateResponse>({
    organization: [],
    personal: [],
  })
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

      setCertificates({
        organization: Array.isArray(data.organization) ? data.organization : [],
        personal: Array.isArray(data.personal) ? data.personal : [],
      })
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

  return (
    <div className="space-y-6">
      <CertificateSection
        title="Certificados de la organización"
        certificates={certificates.organization}
        emptyMessage="Todavía no se han configurado certificados de organización."
      />
      <CertificateSection
        title="Certificados personales"
        certificates={certificates.personal}
        emptyMessage="No tienes certificados personales cargados."
      />
    </div>
  )
}

function CertificateSection({
  title,
  certificates,
  emptyMessage,
}: {
  title: string
  certificates: CertificateSummary[]
  emptyMessage: string
}) {
  if (!certificates.length) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
        <h3 className="mb-2 text-left text-sm font-semibold text-neutral-900">{title}</h3>
        <div className="flex flex-col items-center gap-2 py-4">
          <Shield className="h-10 w-10 text-neutral-300" />
          <p>{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="space-y-4">
        {certificates.map((certificate) => (
          <article
            key={certificate.id}
            className="rounded-md border border-neutral-200 bg-neutral-50 p-4 transition hover:border-indigo-200 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <h4 className="text-sm font-semibold text-neutral-900">RUC {certificate.ruc}</h4>
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
    </section>
  )
}


