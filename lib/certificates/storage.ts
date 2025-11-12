import { prismaServer as prisma } from "@/lib/prisma-server"
import type { CertificateUploadInput, SigningCertificate } from "@/types/certificate"
import { decryptPin, encryptPin } from "./encryption"
import { parseP12Certificate } from "./parser"

export async function storeCertificate(input: CertificateUploadInput): Promise<string> {
  const activate = input.activate ?? true
  const parsed = await parseP12Certificate(input.p12File, input.pin)

  if (parsed.info.validTo <= new Date()) {
    throw new Error("El certificado proporcionado ya expiró")
  }

  const organization = await prisma.organization.findUnique({
    where: { id: input.tenantId },
    select: { ruc: true },
  })

  if (!organization || !organization.ruc) {
    throw new Error("La organización no tiene RUC configurado")
  }

  if (!parsed.info.ruc || !organization.ruc.includes(parsed.info.ruc.split("-")[0])) {
    throw new Error("El RUC del certificado no coincide con el RUC registrado de la organización")
  }

  const encryptedPin = encryptPin(input.pin)

  if (activate) {
    await prisma.digitalCertificate.updateMany({
      where: { organizationId: input.tenantId, isActive: true },
      data: { isActive: false },
    })
  }

  const created = await prisma.digitalCertificate.create({
    data: {
      organizationId: input.tenantId,
      certificateP12: input.p12File,
      certificatePem: parsed.certificatePem,
      certificateChainPem: parsed.certificateChain.length ? parsed.certificateChain.join("\n") : null,
      certificateThumbprint: parsed.info.thumbprint,
      encryptedPin: encryptedPin.encrypted,
      pinSalt: encryptedPin.salt,
      pinIv: encryptedPin.iv,
      pinAuthTag: encryptedPin.authTag,
      ruc: parsed.info.ruc,
      issuer: parsed.info.issuer,
      subject: parsed.info.subject,
      serialNumber: parsed.info.serialNumber,
      validFrom: parsed.info.validFrom,
      validTo: parsed.info.validTo,
      uploadedBy: input.uploadedBy,
      lastUsedAt: null,
      isActive: activate,
    },
  })

  return created.id
}

export async function listCertificates(tenantId: string) {
  const certificates = await prisma.digitalCertificate.findMany({
    where: { organizationId: tenantId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      ruc: true,
      issuer: true,
      subject: true,
      serialNumber: true,
      validFrom: true,
      validTo: true,
      uploadedAt: true,
      lastUsedAt: true,
      isActive: true,
      certificateThumbprint: true,
    },
  })

  return certificates.map((certificate) => ({
    ...certificate,
    daysUntilExpiration: Math.floor(
      (certificate.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  }))
}

export async function getCertificateForSigning(tenantId: string): Promise<SigningCertificate | null> {
  const certificate = await prisma.digitalCertificate.findFirst({
    where: {
      organizationId: tenantId,
      isActive: true,
      validTo: { gt: new Date() },
    },
    orderBy: { uploadedAt: "desc" },
  })

  if (!certificate) {
    return null
  }

  const pin = decryptPin({
    encrypted: certificate.encryptedPin,
    salt: certificate.pinSalt,
    iv: certificate.pinIv,
    authTag: certificate.pinAuthTag,
  })

  const parsed = await parseP12Certificate(Buffer.from(certificate.certificateP12), pin)

  await prisma.digitalCertificate.update({
    where: { id: certificate.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    privateKey: parsed.privateKeyPem,
    certificate: parsed.certificatePem,
    certificateChain: parsed.certificateChain.length ? parsed.certificateChain : undefined,
  }
}


