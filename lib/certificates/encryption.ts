import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const PBKDF2_ITERATIONS = 120_000

interface EncryptedPin {
  encrypted: string
  salt: string
  iv: string
  authTag: string
}

function deriveKey(salt: Buffer): Buffer {
  const masterKey = process.env.CERTIFICATE_ENCRYPTION_KEY

  if (!masterKey) {
    throw new Error("CERTIFICATE_ENCRYPTION_KEY must be configured")
  }

  const masterKeyBuffer = Buffer.from(masterKey, masterKey.length === 64 ? "hex" : "utf8")

  if (masterKeyBuffer.length < KEY_LENGTH) {
    throw new Error("CERTIFICATE_ENCRYPTION_KEY must be at least 32 bytes")
  }

  return pbkdf2Sync(masterKeyBuffer, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256")
}

export function encryptPin(pin: string): EncryptedPin {
  const salt = randomBytes(16)
  const key = deriveKey(salt)
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(pin, "utf8", "base64")
  encrypted += cipher.final("base64")

  const authTag = cipher.getAuthTag().toString("base64")

  return {
    encrypted,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    authTag,
  }
}

export function decryptPin(data: EncryptedPin): string {
  const salt = Buffer.from(data.salt, "base64")
  const iv = Buffer.from(data.iv, "base64")
  const authTag = Buffer.from(data.authTag, "base64")
  const key = deriveKey(salt)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(data.encrypted, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
