import { SignedXml } from "xml-crypto"
import { DOMParser, XMLSerializer } from "@xmldom/xmldom"

export interface SignXmlOptions {
  privateKey: string
  certificate: string
  certificateChain?: string[]
  canonicalizationAlgorithm?: string
  signatureAlgorithm?: string
  digestAlgorithm?: string
}

export function signXml(xmlString: string, options: SignXmlOptions): string {
  const {
    privateKey,
    certificate,
    certificateChain = [],
    canonicalizationAlgorithm = "http://www.w3.org/2001/10/xml-exc-c14n#",
    signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
    digestAlgorithm = "http://www.w3.org/2001/04/xmlenc#sha256",
  } = options

  const document = new DOMParser().parseFromString(xmlString, "text/xml")
  const signedXml = new SignedXml()

  signedXml.privateKey = privateKey
  signedXml.signatureAlgorithm = signatureAlgorithm
  signedXml.canonicalizationAlgorithm = canonicalizationAlgorithm
  signedXml.signaturePrefix = "ds"

  signedXml.addReference({
    xpath: "/*",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      canonicalizationAlgorithm,
    ],
    digestAlgorithm,
    uri: "",
    isEmptyUri: true,
  })

  const cleanCert = cleanPem(certificate)
  const chain = certificateChain.map(cleanPem)

  const keyInfoContent = [
    `<ds:X509Certificate>${cleanCert}</ds:X509Certificate>`,
    ...chain.map((cert) => `<ds:X509Certificate>${cert}</ds:X509Certificate>`),
  ].join("")

  signedXml.keyInfoProvider = {
    getKeyInfo: () => `<ds:X509Data>${keyInfoContent}</ds:X509Data>`,
  }

  signedXml.keyInfo = `<ds:KeyInfo><ds:X509Data>${keyInfoContent}</ds:X509Data></ds:KeyInfo>`

  signedXml.computeSignature(new XMLSerializer().serializeToString(document), {
    prefix: "ds",
    location: {
      reference: "/*",
      action: "append",
    },
  })

  let signedOutput = signedXml.getSignedXml()

  if (!signedOutput.includes("<ds:KeyInfo")) {
    const keyInfoXml = `<ds:KeyInfo><ds:X509Data>${keyInfoContent}</ds:X509Data></ds:KeyInfo>`
    signedOutput = signedOutput.replace("</ds:Signature>", `${keyInfoXml}</ds:Signature>`)
  }

  return signedOutput
}

function cleanPem(pem: string): string {
  return pem
    .replace(/-----BEGIN CERTIFICATE-----/, "")
    .replace(/-----END CERTIFICATE-----/, "")
    .replace(/\r?\n|\r/g, "")
}


