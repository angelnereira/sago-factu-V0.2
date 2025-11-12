import forge from "node-forge"

export interface ParsedCertificate {
  privateKeyPem: string
  certificatePem: string
  certificateChain: string[]
  info: {
    ruc: string
    issuer: string
    subject: string
    serialNumber: string
    validFrom: Date
    validTo: Date
    thumbprint: string
  }
}

export async function parseP12Certificate(
  p12Buffer: Buffer,
  pin: string,
): Promise<ParsedCertificate> {
  try {
    const p12Der = forge.util.decode64(p12Buffer.toString("base64"))
    const p12Asn1 = forge.asn1.fromDer(p12Der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pin)

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    const keys = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]

    if (!keys || keys.length === 0) {
      throw new Error("El archivo P12 no contiene clave privada")
    }

    const privateKey = keys[0].key as forge.pki.PrivateKey | undefined
    if (!privateKey) {
      throw new Error("No fue posible extraer la clave privada del certificado")
    }

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const certs = certBags[forge.pki.oids.certBag]

    if (!certs || certs.length === 0) {
      throw new Error("No se encontró certificado X509 en el archivo P12")
    }

    const mainCertificate = certs[0].cert as forge.pki.Certificate
    const certificatePem = forge.pki.certificateToPem(mainCertificate)
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey)

    const certificateChain = certs.slice(1).map((bag) => forge.pki.certificateToPem(bag.cert))

    const subject = formatName(mainCertificate.subject)
    const issuer = formatName(mainCertificate.issuer)
    const ruc = extractRuc(mainCertificate)
    const serialNumber = mainCertificate.serialNumber
    const validFrom = mainCertificate.validity.notBefore
    const validTo = mainCertificate.validity.notAfter
    const thumbprint = forge.md.sha1
      .create()
      .update(
        forge.asn1
          .toDer(forge.pki.certificateToAsn1(mainCertificate))
          .getBytes(),
      )
      .digest()
      .toHex()

    return {
      privateKeyPem,
      certificatePem,
      certificateChain,
      info: { ruc, issuer, subject, serialNumber, validFrom, validTo, thumbprint },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    throw new Error(`No fue posible procesar el certificado: ${message}`)
  }
}

function formatName(name: forge.pki.CertificateField): string {
  return name.attributes
    .map((attr) => `${attr.shortName || attr.name}=${attr.value}`)
    .join(", ")
}

function extractRuc(certificate: forge.pki.Certificate): string {
  const serialNumberField = certificate.subject.getField("serialNumber")
    ?? certificate.subject.getField({ type: "2.5.4.5" })

  if (serialNumberField?.value) {
    const value = serialNumberField.value.trim()
    const match = value.match(/(\d{1,}-\d{1,}-\d{1,})/)
    if (match) {
      return match[1]
    }
  }

  const commonName = certificate.subject.getField("CN")
  if (commonName?.value) {
    const match = commonName.value.match(/(\d{1,}-\d{1,}-\d{1,})/)
    if (match) {
      return match[1]
    }
  }

  const sanExtension = certificate.extensions.find((ext) => ext.name === "subjectAltName")
  if (sanExtension && "altNames" in sanExtension && sanExtension.altNames) {
    for (const altName of sanExtension.altNames) {
      if (altName.type === 2) {
        const match = altName.value.match(/RUC[:\s]*([0-9-]+)/i)
        if (match) {
          return match[1]
        }
      }
    }
  }

  throw new Error("El certificado no contiene el RUC del emisor")
}


