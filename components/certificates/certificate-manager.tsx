"use client"

import { useEffect, useState } from "react"

import { CertificateList } from "./CertificateList"
import { CertificateStatus } from "./CertificateStatus"
import { CertificateUploader } from "./CertificateUploader"

interface CertificateManagerProps {
  refreshToken?: number
  onCertificatesChanged?: () => void
}

export function CertificateManager({
  refreshToken: externalRefreshToken = 0,
  onCertificatesChanged,
}: CertificateManagerProps) {
  const [refreshToken, setRefreshToken] = useState(externalRefreshToken)

  useEffect(() => {
    setRefreshToken(externalRefreshToken)
  }, [externalRefreshToken])

  const handleRefresh = () => {
    setRefreshToken((token) => token + 1)
    onCertificatesChanged?.()
  }

  return (
    <div className="space-y-6">
      <CertificateStatus refreshToken={refreshToken} />
      <CertificateUploader onUploaded={handleRefresh} />
      <CertificateList refreshToken={refreshToken} />
    </div>
  )
}

