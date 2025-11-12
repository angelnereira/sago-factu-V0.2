"use client"

import { useState } from "react"

import { CertificateManager } from "./certificate-manager"
import { DigitalSignatureSettings } from "./digital-signature-settings"

interface CertificateOption {
  id: string
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  ruc: string
}

interface DigitalSignaturePanelProps {
  initialCertificates: CertificateOption[]
  initialConfig: {
    signatureMode: "ORGANIZATION" | "PERSONAL"
    digitalCertificateId: string | null
    autoSign: boolean
    notifyOnExpiration: boolean
  } | null
}

export function DigitalSignaturePanel({
  initialCertificates,
  initialConfig,
}: DigitalSignaturePanelProps) {
  const [refreshToken, setRefreshToken] = useState(0)

  const handleCertificatesChanged = () => {
    setRefreshToken((token) => token + 1)
  }

  return (
    <div className="space-y-6">
      <CertificateManager
        refreshToken={refreshToken}
        onCertificatesChanged={handleCertificatesChanged}
      />
      <DigitalSignatureSettings
        initialCertificates={initialCertificates}
        initialConfig={initialConfig}
        refreshToken={refreshToken}
      />
    </div>
  )
}


