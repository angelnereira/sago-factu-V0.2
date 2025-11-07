import { SignedXml } from "xml-crypto"
import forge from "node-forge"

import { CertificateManager } from "./manager"

const DEMO_SIGNATURE_TEMPLATE = `
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
    <ds:Reference URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
      <ds:DigestValue>DEMO_DIGEST_VALUE</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>DEMO_SIGNATURE_VALUE</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>DEMO_CERTIFICATE</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
</ds:Signature>`

export class XMLSigner {
  private readonly certificateManager = new CertificateManager()

  async signXML(xmlContent: string, organizationId: string): Promise<string> {
    try {
      const certificate = await this.certificateManager.getActiveCertificate(organizationId)

      const asn1 = forge.asn1.fromDer(
        forge.util.createBuffer(certificate.certificateBuffer.toString("binary"), "binary"),
      )
      const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, certificate.password)

      const keyBagArray = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
        forge.pki.oids.pkcs8ShroudedKeyBag
      ]
      if (!keyBagArray || keyBagArray.length === 0) {
        throw new Error("El certificado no contiene clave privada válida")
      }

      const certBagArray = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]
      if (!certBagArray || certBagArray.length === 0) {
        throw new Error("No se encontró certificado X509 en el archivo PFX/P12")
      }

      const privateKeyPem = forge.pki.privateKeyToPem(keyBagArray[0].key as forge.pki.PrivateKey)
      const certificatePem = forge.pki.certificateToPem(certBagArray[0].cert as forge.pki.Certificate)

      const unsignedXml = this.removeExistingSignature(xmlContent)

      const signedXml = new SignedXml()
      signedXml.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
      signedXml.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"

      signedXml.addReference(
        "//*[local-name()='rFE']",
        [
          "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
          "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
        ],
        "http://www.w3.org/2001/04/xmlenc#sha256",
      )

      signedXml.signingKey = privateKeyPem
      signedXml.keyInfoProvider = {
        getKeyInfo: () =>
          `<X509Data><X509Certificate>${certificatePem
            .replace("-----BEGIN CERTIFICATE-----", "")
            .replace("-----END CERTIFICATE-----", "")
            .replace(/\r?\n/g, "")}</X509Certificate></X509Data>`,
      }

      signedXml.computeSignature(unsignedXml, {
        location: { reference: "//*[local-name()='rFE']", action: "append" },
      })

      return signedXml.getSignedXml()
    } catch (error) {
      if (process.env.HKA_ENVIRONMENT?.toLowerCase() === "demo") {
        console.warn("⚠️  XMLSigner: usando firma simulada para ambiente DEMO", error)
        return this.addDemoSignature(xmlContent)
      }

      throw error
    }
  }

  private removeExistingSignature(xml: string): string {
    return xml.replace(/<ds:Signature[\s\S]*?<\/ds:Signature>/gi, "").trim()
  }

  private addDemoSignature(xml: string): string {
    const sanitizedXml = this.removeExistingSignature(xml)
    if (!sanitizedXml.includes("</rFE>")) {
      return `${sanitizedXml}${DEMO_SIGNATURE_TEMPLATE}`
    }

    return sanitizedXml.replace("</rFE>", `${DEMO_SIGNATURE_TEMPLATE}\n</rFE>`)
  }
}

