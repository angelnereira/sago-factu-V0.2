import { SignedXml } from "xml-crypto"
import { DOMParser, XMLSerializer } from "@xmldom/xmldom"
import { hkaLogger } from '../hka/utils/logger'

/**
 * Opciones para firmar un XML según estándares de Panamá
 */
export interface SignXmlOptions {
  /** Clave privada en formato PEM */
  privateKey: string
  /** Certificado X.509 en formato PEM */
  certificate: string
  /** Cadena de certificación (opcional) */
  certificateChain?: string[]
  /** Algoritmo de canonicalización (default: Exclusive C14N según DGI) */
  canonicalizationAlgorithm?: string
  /** Algoritmo de firma (default: RSA-SHA256 según DGI) */
  signatureAlgorithm?: string
  /** Algoritmo de digest (default: SHA-256 según DGI) */
  digestAlgorithm?: string
  /** XPath del elemento a firmar (default: raíz del documento) */
  elementXPath?: string
}

/**
 * Resultado de la operación de firma
 */
export interface SignatureResult {
  /** XML firmado */
  signedXml: string
  /** Timestamp de cuando se firmó */
  signedAt: Date
  /** Huella digital de la firma */
  signatureHash: string
  /** Información del certificado usado */
  certificateInfo: {
    subject: string
    issuer: string
    validTo: Date
  }
}

/**
 * Firma un XML según estándares XMLDSig para facturación electrónica en Panamá
 *
 * Especificaciones:
 * - Algoritmo: RSA-SHA256
 * - Canonicalización: Exclusive C14N
 * - Transform: Enveloped Signature
 * - Namespace: http://www.w3.org/2000/09/xmldsig#
 *
 * @param xmlString XML a firmar
 * @param options Opciones de firma
 * @returns XML firmado
 * @throws Error si la firma falla
 */
export function signXml(xmlString: string, options: SignXmlOptions): string {
  try {
    const {
      privateKey,
      certificate,
      certificateChain = [],
      canonicalizationAlgorithm = "http://www.w3.org/2001/10/xml-exc-c14n#",
      signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
      digestAlgorithm = "http://www.w3.org/2001/04/xmlenc#sha256",
      elementXPath = "/*",
    } = options

    // Parsear XML
    const document = new DOMParser().parseFromString(xmlString, "text/xml")
    if (document.documentElement.nodeName === '#document') {
      throw new Error('Documento XML inválido')
    }

    // Validar que la clave privada y certificado estén presentes
    if (!privateKey || !privateKey.includes('PRIVATE KEY')) {
      throw new Error('Clave privada inválida o no disponible')
    }
    if (!certificate || !certificate.includes('CERTIFICATE')) {
      throw new Error('Certificado X.509 inválido o no disponible')
    }

    // Crear objeto SignedXml
    const signedXml = new SignedXml()

    // Configurar clave privada y algoritmos
    signedXml.privateKey = privateKey
    signedXml.signatureAlgorithm = signatureAlgorithm
    signedXml.canonicalizationAlgorithm = canonicalizationAlgorithm
    signedXml.signaturePrefix = "ds"

    // Agregar referencia al documento completo
    signedXml.addReference({
      xpath: elementXPath,
      transforms: [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        canonicalizationAlgorithm,
      ],
      digestAlgorithm,
      uri: "",
      isEmptyUri: true,
    })

    // Preparar cadena de certificados
    const cleanCert = cleanPem(certificate)
    const chain = certificateChain.map(cleanPem)

    const keyInfoContent = [
      `<ds:X509Certificate>${cleanCert}</ds:X509Certificate>`,
      ...chain.map((cert) => `<ds:X509Certificate>${cert}</ds:X509Certificate>`),
    ].join("")

    // Configurar KeyInfo provider
    signedXml.keyInfoProvider = {
      getKeyInfo: () => `<ds:X509Data>${keyInfoContent}</ds:X509Data>`,
    }

    signedXml.keyInfo = `<ds:KeyInfo><ds:X509Data>${keyInfoContent}</ds:X509Data></ds:KeyInfo>`

    // Computar firma
    signedXml.computeSignature(new XMLSerializer().serializeToString(document), {
      prefix: "ds",
      location: {
        reference: elementXPath,
        action: "append",
      },
    })

    // Obtener XML firmado
    let signedOutput = signedXml.getSignedXml()

    // Asegurar que KeyInfo está presente
    if (!signedOutput.includes("<ds:KeyInfo")) {
      const keyInfoXml = `<ds:KeyInfo><ds:X509Data>${keyInfoContent}</ds:X509Data></ds:KeyInfo>`
      signedOutput = signedOutput.replace("</ds:Signature>", `${keyInfoXml}</ds:Signature>`)
    }

    // Logging
    hkaLogger.info('[XMLDSig] Firma digital aplicada exitosamente', {
      signatureAlgorithm,
      canonicalizationAlgorithm,
      digestAlgorithm,
    })

    return signedOutput
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[XMLDSig] Error al firmar XML:', { error: errorMsg })
    throw new Error(`Error al firmar XML: ${errorMsg}`)
  }
}

/**
 * Firma un XML y retorna información completa de la operación
 *
 * @param xmlString XML a firmar
 * @param options Opciones de firma
 * @returns Resultado de la firma con metadatos
 */
export function signXmlWithInfo(
  xmlString: string,
  options: SignXmlOptions
): SignatureResult {
  const signedXml = signXml(xmlString, options)

  // Extraer información del certificado
  const cert = options.certificate
  const subjectMatch = cert.match(/Subject: (.+)/)
  const issuerMatch = cert.match(/Issuer: (.+)/)

  // Calcular hash de la firma
  const { createHash } = require('crypto')
  const hash = createHash('sha256')
  hash.update(signedXml)
  const signatureHash = hash.digest('hex')

  return {
    signedXml,
    signedAt: new Date(),
    signatureHash,
    certificateInfo: {
      subject: subjectMatch ? subjectMatch[1] : 'Unknown',
      issuer: issuerMatch ? issuerMatch[1] : 'Unknown',
      validTo: new Date(),
    },
  }
}

/**
 * Verifica la firma digital de un XML
 *
 * @param signedXml XML firmado
 * @param publicCertificate Certificado público para verificación
 * @returns true si la firma es válida
 */
export function verifySignature(
  signedXml: string,
  publicCertificate: string
): boolean {
  try {
    const document = new DOMParser().parseFromString(signedXml, "text/xml")

    const signature = document.getElementsByTagNameNS(
      'http://www.w3.org/2000/09/xmldsig#',
      'Signature'
    )[0]

    if (!signature) {
      hkaLogger.warn('[XMLDSig] No se encontró elemento Signature en el XML')
      return false
    }

    const verifier = new SignedXml()
    verifier.publicCert = cleanPem(publicCertificate)
    verifier.loadSignature(signature)

    const isValid = verifier.checkSignature(signedXml)

    hkaLogger.info('[XMLDSig] Verificación de firma completada', {
      isValid,
    })

    return isValid
  } catch (error) {
    hkaLogger.error('[XMLDSig] Error verificando firma:', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

/**
 * Limpia un certificado PEM para usarlo en XML
 * Remueve headers, footers y saltos de línea
 *
 * @param pem Certificado en formato PEM
 * @returns Certificado limpio en base64
 */
function cleanPem(pem: string): string {
  return pem
    .replace(/-----BEGIN CERTIFICATE-----/, "")
    .replace(/-----END CERTIFICATE-----/, "")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, "")
    .replace(/-----END RSA PRIVATE KEY-----/, "")
    .replace(/\r?\n|\r/g, "")
    .trim()
}
