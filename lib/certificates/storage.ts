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

  let targetRuc: string | null = null

  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { ruc: true },
    })

    if (!user?.ruc) {
      throw new Error("El usuario no tiene RUC configurado en su perfil.")
    }

    targetRuc = user.ruc
  } else {
    const organization = await prisma.organization.findUnique({
      where: { id: input.tenantId },
      select: { ruc: true },
    })

    if (!organization || !organization.ruc) {
      throw new Error("La organización no tiene RUC configurado")
    }

    targetRuc = organization.ruc
  }

  if (!parsed.info.ruc || !targetRuc.includes(parsed.info.ruc.split("-")[0])) {
    throw new Error(
      input.userId
        ? "El RUC del certificado no coincide con el RUC registrado en tu perfil."
        : "El RUC del certificado no coincide con el RUC registrado de la organización.",
    )
  }

  const encryptedPin = encryptPin(input.pin)

  // 🔑 STRATEGY: Delete old certificates instead of just deactivating
  // This prevents certificate accumulation in the database
  const whereClause = input.userId
    ? { userId: input.userId }
    : { organizationId: input.tenantId, userId: null };

  const oldCerts = await prisma.digitalCertificate.findMany({
    where: whereClause,
    select: { id: true },
  });

  if (oldCerts.length > 0) {
    await prisma.digitalCertificate.deleteMany({
      where: whereClause,
    });
    console.log(`[CERTIFICATES] Deleted ${oldCerts.length} old certificate(s) for ${input.userId ? `user ${input.userId}` : `organization ${input.tenantId}`}`);
  }

  const created = await prisma.digitalCertificate.create({
    data: {
      organizationId: input.userId ? null : input.tenantId,
      userId: input.userId ?? null,
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

export async function listUserCertificates(userId: string) {
  const certificates = await prisma.digitalCertificate.findMany({
    where: { userId },
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
      userId: null,
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


