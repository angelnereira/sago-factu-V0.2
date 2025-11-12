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
}

export function CertificateStatus({ refreshToken }: { refreshToken?: number }) {
  const [activeCertificate, setActiveCertificate] = useState<ActiveCertificate | null>(null)

  useEffect(() => {
    void fetchActiveCertificate()
  }, [refreshToken])

  const fetchActiveCertificate = async () => {
    const response = await fetch("/api/certificates")
    const list = await response.json()

    if (Array.isArray(list)) {
      const active = list.find((cert) => cert.isActive)
      setActiveCertificate(active ?? null)
    }
  }

  if (!activeCertificate) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
        Actualmente no hay un certificado activo. Carga un certificado válido para firmar las facturas.
      </div>
    )
  }

  const expiresSoon = activeCertificate.daysUntilExpiration < 30

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
          Certificado activo: {activeCertificate.subject} (RUC {activeCertificate.ruc})
        </span>
      </div>
      <p className="mt-2 text-xs">
        Vigencia: {new Date(activeCertificate.validFrom).toLocaleDateString()} -{" "}
        {new Date(activeCertificate.validTo).toLocaleDateString()} ({activeCertificate.daysUntilExpiration} días restantes)
      </p>
    </div>
  )
}


