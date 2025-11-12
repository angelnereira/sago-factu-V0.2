import forge from "node-forge"

import { signXml } from "@/lib/xmldsig/signer"
import { DOMParser } from "@xmldom/xmldom"
import { SignedXml } from "xml-crypto"

describe("XML digital signature", () => {
  const baseXml = `<?xml version="1.0" encoding="UTF-8"?>
  <rFE xmlns="http://dgi-fep.mef.gob.pa">
    <gEmisor>
      <dRUC>123456789-1-123456</dRUC>
      <dDV>12</dDV>
    </gEmisor>
  </rFE>`

  const { privateKeyPem, certificatePem } = createTestCertificate()

  it("should sign XML with RSA-SHA256", () => {
    const signedXml = signXml(baseXml, {
      privateKey: privateKeyPem,
      certificate: certificatePem,
    })

    expect(signedXml).toContain("<ds:Signature")
    expect(signedXml).toContain("rsa-sha256")
    expect(signedXml).toContain("xml-exc-c14n")
    expect(signedXml).toContain("<ds:X509Certificate>")

    const doc = new DOMParser().parseFromString(signedXml, "application/xml")
    const signatureNode = doc.getElementsByTagName("ds:Signature")[0]

    const verifier = new SignedXml()
    verifier.publicCert = certificatePem
    verifier.loadSignature(signatureNode)

    expect(verifier.checkSignature(signedXml)).toBe(true)
  })
})

function createTestCertificate() {
  const keys = forge.pki.rsa.generateKeyPair(2048)
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = "01"
  const now = new Date()
  cert.validity.notBefore = new Date(now.getTime() - 60_000)
  cert.validity.notAfter = new Date(now.getTime() + 60_000)

  const attrs = [{ name: "commonName", value: "Test Certificate" }]
  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
    { name: "extKeyUsage", serverAuth: true, clientAuth: true },
  ])

  cert.sign(keys.privateKey, forge.md.sha256.create())

  return {
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    certificatePem: forge.pki.certificateToPem(cert),
  }
}
