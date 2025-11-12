import { getCertificateForSigning } from "@/lib/certificates/storage"
import { signXml } from "@/lib/xmldsig/signer"

export async function signInvoiceXml(xmlString: string, tenantId: string): Promise<string> {
  const certificate = await getCertificateForSigning(tenantId)

  if (!certificate) {
    throw new Error("No hay un certificado digital activo configurado para esta organización")
  }

  return signXml(xmlString, {
    privateKey: certificate.privateKey,
    certificate: certificate.certificate,
    certificateChain: certificate.certificateChain,
  })
}


