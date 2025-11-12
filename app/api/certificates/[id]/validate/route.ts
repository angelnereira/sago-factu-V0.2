import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { decryptPin } from "@/lib/certificates/encryption"
import { parseP12Certificate } from "@/lib/certificates/parser"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = params
    const certificate = await prisma.digitalCertificate.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    })

    if (!certificate) {
      return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 })
    }

    const pin = decryptPin({
      encrypted: certificate.encryptedPin,
      salt: certificate.pinSalt,
      iv: certificate.pinIv,
      authTag: certificate.pinAuthTag,
    })

    const parsed = await parseP12Certificate(Buffer.from(certificate.certificateP12), pin)

    return NextResponse.json({
      valid: parsed.info.validTo > new Date(),
      ruc: parsed.info.ruc,
      issuer: parsed.info.issuer,
      subject: parsed.info.subject,
      serialNumber: parsed.info.serialNumber,
      validFrom: parsed.info.validFrom,
      validTo: parsed.info.validTo,
      thumbprint: parsed.info.thumbprint,
    })
  } catch (error) {
    console.error("[API] Error validando certificado:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al validar el certificado" },
      { status: 500 },
    )
  }
}


