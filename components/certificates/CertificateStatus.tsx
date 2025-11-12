"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, AlertTriangle } from "lucide-react"

interface ActiveCertificate {
  id: string
  subject: string
  issuer: string
  ruc: string
  validTo: string
  validFrom: string
  daysUntilExpiration: number
  scope: "organization" | "personal"
}

interface StatusResponse {
  organization: ActiveCertificate | null
  personal: ActiveCertificate | null
}

export function CertificateStatus({ refreshToken }: { refreshToken?: number }) {
  const [activeCertificate, setActiveCertificate] = useState<StatusResponse>({
    organization: null,
    personal: null,
  })

  useEffect(() => {
    void fetchActiveCertificate()
  }, [refreshToken])

  const fetchActiveCertificate = async () => {
    const response = await fetch("/api/certificates")
    const data = await response.json()

    if (data?.organization || data?.personal) {
      const organizationActive =
        data.organization?.find((cert: any) => cert.isActive) ?? null
      const personalActive =
        data.personal?.find((cert: any) => cert.isActive) ?? null
      setActiveCertificate({
        organization: organizationActive
          ? { ...organizationActive, scope: "organization" }
          : null,
        personal: personalActive ? { ...personalActive, scope: "personal" } : null,
      })
    }
  }

  const hasOrg = Boolean(activeCertificate.organization)
  const hasPersonal = Boolean(activeCertificate.personal)

  if (!hasOrg && !hasPersonal) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
        Actualmente no hay certificados activos. Carga un certificado válido para firmar las facturas.
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {activeCertificate.organization && (
        <CertificateCard certificate={activeCertificate.organization} title="Organización" />
      )}
      {activeCertificate.personal && (
        <CertificateCard certificate={activeCertificate.personal} title="Personal" />
      )}
    </div>
  )
}

function CertificateCard({ certificate, title }: { certificate: ActiveCertificate; title: string }) {
  const expiresSoon = certificate.daysUntilExpiration < 30
  return (
    <div
      className={`rounded-lg border p-4 text-sm ${
        expiresSoon
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      <div className="flex items-center gap-2">
        {expiresSoon ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        <span className="font-medium">
          Certificado activo ({title}): {certificate.subject} (RUC {certificate.ruc})
        </span>
      </div>
      <p className="mt-2 text-xs">
        Vigencia: {new Date(certificate.validFrom).toLocaleDateString()} -{" "}
        {new Date(certificate.validTo).toLocaleDateString()} ({certificate.daysUntilExpiration} días restantes)
      </p>
    </div>
  )
}


