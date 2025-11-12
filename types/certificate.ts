export interface CertificateUploadInput {
  tenantId: string
  userId?: string
  p12File: Buffer
  pin: string
  uploadedBy: string
  activate?: boolean
}

export interface CertificateInfo {
  id: string
  ruc: string
  issuer: string
  subject: string
  serialNumber: string
  validFrom: Date
  validTo: Date
  isActive: boolean
  daysUntilExpiration: number
}

export interface SigningCertificate {
  privateKey: string
  certificate: string
  certificateChain?: string[]
}


