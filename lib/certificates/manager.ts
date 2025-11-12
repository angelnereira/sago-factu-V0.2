import type { Certificate as CertificateRecord } from "@prisma/client"
import forge from "node-forge"

import prismaServer from "@/lib/prisma-server"

import { CertificateEncryption } from "./encryption"

type UploadResult = CertificateRecord

export class CertificateManager {
  private readonly encryption: CertificateEncryption

  constructor() {
    const masterKey = process.env.CERTIFICATE_MASTER_KEY
    if (!masterKey) {
      throw new Error("CERTIFICATE_MASTER_KEY is not configured")
    }

    this.encryption = new CertificateEncryption(masterKey)
  }

  async uploadCertificate(
    organizationId: string,
    certificateBuffer: Buffer,
    password: string,
    uploadedBy: string,
    options: { activate?: boolean } = {},
  ): Promise<UploadResult> {
    try {
      const activate = options.activate ?? true

      const asn1 = forge.asn1.fromDer(
        forge.util.createBuffer(certificateBuffer.toString("binary"), "binary"),
      )
      const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password)

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]
      if (!certBags || certBags.length === 0) {
        throw new Error("El certificado no contiene información X509 válida")
      }
      const certificate = certBags[0].cert

      if (!certificate) {
        throw new Error("No se pudo extraer el certificado X509")
      }

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
        forge.pki.oids.pkcs8ShroudedKeyBag
      ]
      if (!keyBags || keyBags.length === 0) {
        throw new Error("El archivo PFX no contiene clave privada")
      }

      const privateKey = keyBags[0]?.key as forge.pki.PrivateKey | undefined
      const publicKey = certificate.publicKey as forge.pki.rsa.PublicKey | undefined

      if (!privateKey || !("n" in privateKey) || typeof privateKey.n?.bitLength !== "function") {
        throw new Error("La clave privada debe ser un RSA válido")
      }

      if (!publicKey || !("n" in publicKey) || typeof publicKey.n?.bitLength !== "function") {
        throw new Error("El certificado debe incluir una clave pública RSA válida")
      }

      const privateKeyBits = privateKey.n.bitLength()
      const publicKeyBits = publicKey.n.bitLength()

      if (privateKeyBits < 2048 || publicKeyBits < 2048) {
        throw new Error("El certificado debe usar claves RSA de al menos 2048 bits")
      }

      const subjectCN = certificate.subject.getField("CN")?.value || "Certificado sin CN"
      const issuerCN = certificate.issuer.getField("CN")?.value || "Desconocido"

      const serialField =
        certificate.subject.getField("serialNumber") ||
        certificate.subject.getField({ type: "2.5.4.5" })
      const serialValue = serialField?.value ?? ""

      if (!serialValue) {
        throw new Error("El certificado no contiene el RUC en el campo serialNumber")
      }

      const [rucBase, dv] = serialValue.split("-")
      if (!rucBase || !dv) {
        throw new Error("El campo serialNumber del certificado no tiene el formato esperado")
      }

      const certificateDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes()
      const thumbprint = forge.md.sha1.create().update(certificateDer).digest().toHex()

      const encryptedCertificate = this.encryption.encrypt(certificateBuffer)
      const encryptedPassword = this.encryption.encrypt(Buffer.from(password, "utf-8"))

      if (activate) {
        await prismaServer.certificate.updateMany({
          where: { organizationId, isActive: true },
          data: { isActive: false },
        })
      }

      const createdCertificate = await prismaServer.certificate.create({
        data: {
          organizationId,
          certificateData: encryptedCertificate.encrypted,
          certificateIv: encryptedCertificate.iv,
          certificateTag: encryptedCertificate.tag,
          passwordEncrypted: encryptedPassword.encrypted,
          passwordIv: encryptedPassword.iv,
          passwordTag: encryptedPassword.tag,
          serialNumber: certificate.serialNumber,
          issuer: issuerCN,
          subject: subjectCN,
          thumbprint,
          ruc: rucBase,
          dv,
          validFrom: certificate.validity.notBefore,
          validUntil: certificate.validity.notAfter,
          isActive: activate,
          uploadedBy,
        },
      })

      return createdCertificate
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "No fue posible procesar el certificado. Verifique el archivo y la contraseña.",
      )
    }
  }

  async getActiveCertificate(organizationId: string) {
    const certificate = await prismaServer.certificate.findFirst({
      where: {
        organizationId,
        isActive: true,
        validUntil: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!certificate) {
      throw new Error("No hay certificado activo configurado para esta organización")
    }

    const certificateBuffer = this.encryption.decrypt(
      certificate.certificateData,
      certificate.certificateIv,
      certificate.certificateTag,
    )

    const passwordBuffer = this.encryption.decrypt(
      certificate.passwordEncrypted,
      certificate.passwordIv,
      certificate.passwordTag,
    )

    return {
      ...certificate,
      certificateBuffer,
      password: passwordBuffer.toString("utf-8"),
    }
  }

  async validateCertificate(organizationId: string) {
    try {
      const certificate = await this.getActiveCertificate(organizationId)
      const now = new Date()
      const diff = certificate.validUntil.getTime() - now.getTime()
      const daysUntilExpiry = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry <= 0) {
        return {
          valid: false,
          message: "El certificado ha expirado",
        }
      }

      return {
        valid: true,
        daysUntilExpiry,
        subject: certificate.subject,
      }
    } catch (error) {
      return {
        valid: false,
        message:
          error instanceof Error ? error.message : "No hay certificado configurado para esta organización",
      }
    }
  }
}

