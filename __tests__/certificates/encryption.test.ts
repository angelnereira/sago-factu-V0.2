import { encryptPin, decryptPin } from "@/lib/certificates/encryption"

describe("encryptPin / decryptPin", () => {
  beforeAll(() => {
    process.env.CERTIFICATE_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef"
  })

  it("should encrypt and decrypt the PIN preserving original value", () => {
    const encrypted = encryptPin("123456")
    expect(encrypted.encrypted).toBeDefined()
    expect(encrypted.iv.length).toBeGreaterThan(0)
    expect(encrypted.authTag.length).toBeGreaterThan(0)

    const decrypted = decryptPin(encrypted)
    expect(decrypted).toBe("123456")
  })

  it("should produce different ciphertext for the same PIN due to random iv/salt", () => {
    const first = encryptPin("654321")
    const second = encryptPin("654321")

    expect(first.encrypted).not.toEqual(second.encrypted)
    expect(first.iv).not.toEqual(second.iv)
    expect(first.salt).not.toEqual(second.salt)
  })
})
