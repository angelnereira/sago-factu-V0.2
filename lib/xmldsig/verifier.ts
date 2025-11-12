import { SignedXml } from "xml-crypto"
import forge from "node-forge"
import { DOMParser, XMLSerializer } from "@xmldom/xmldom"

export interface VerifyResult {
  valid: boolean
  error?: string
}

export function verifyXmlSignature(xmlString: string, publicCertPem?: string): VerifyResult {
  try {
    const doc = new DOMParser().parseFromString(xmlString, "application/xml")
    const signature =
      doc.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "Signature")[0] ??
      doc.getElementsByTagName("Signature")[0]

    if (!signature) {
      return { valid: false, error: "No se encontró el nodo Signature en el XML" }
    }

    const signedXml = new SignedXml()
    signedXml.loadSignature(signature)

    signedXml.keyInfoProvider = {
      getKeyInfo: () => "",
      getKey: () => {
        if (publicCertPem) {
          const certificate = forge.pki.certificateFromPem(publicCertPem)
          const publicKey = forge.pki.publicKeyToPem(certificate.publicKey)
          signedXml.publicCert = publicKey
          return publicKey
        }

        const certificateNode =
          signature.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "X509Certificate")[0] ??
          signature.getElementsByTagName("ds:X509Certificate")[0] ??
          signature.getElementsByTagName("X509Certificate")[0]

        if (!certificateNode?.textContent) {
          throw new Error("El XML firmado no contiene el certificado público")
        }

        const pem = wrapCertificate(certificateNode.textContent)
        const certificate = forge.pki.certificateFromPem(pem)
        const publicKey = forge.pki.publicKeyToPem(certificate.publicKey)
        signedXml.publicCert = publicKey
        return publicKey
      },
    }

    const normalizedXml = new XMLSerializer().serializeToString(doc)
    const isValid = signedXml.checkSignature(normalizedXml)

    if (!isValid) {
      return { valid: false, error: signedXml.validationErrors.join(", ") }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Error verificando la firma XML",
    }
  }
}

function wrapCertificate(cert: string): string {
  const cleaned = cert.replace(/\\s+/g, "")
  const lines = cleaned.match(/.{1,64}/g) ?? []
  return `-----BEGIN CERTIFICATE-----\\n${lines.join("\\n")}\\n-----END CERTIFICATE-----`
}



