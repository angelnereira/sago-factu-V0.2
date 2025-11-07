import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

interface EncryptionResult {
  encrypted: string
  iv: string
  tag: string
}

export class CertificateEncryption {
  private readonly algorithm = "aes-256-gcm"
  private readonly key: Buffer

  constructor(masterKey: string) {
    if (!masterKey) {
      throw new Error("CERTIFICATE_MASTER_KEY must be configured")
    }

    this.key = createHash("sha256").update(masterKey).digest()
  }

  encrypt(data: Buffer): EncryptionResult {
    const iv = randomBytes(12); // Tamaño recomendado para GCM
    const cipher = createCipheriv(this.algorithm, this.key, iv)

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
    const tag = cipher.getAuthTag()

    return {
      encrypted: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
    }
  }

  decrypt(encryptedData: string, iv: string, tag: string): Buffer {
    const decipher = createDecipheriv(this.algorithm, this.key, Buffer.from(iv, "base64"))
    decipher.setAuthTag(Buffer.from(tag, "base64"))

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData, "base64")),
      decipher.final(),
    ])

    return decrypted
  }
}

