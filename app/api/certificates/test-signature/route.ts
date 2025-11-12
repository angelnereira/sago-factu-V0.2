import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { signInvoiceXml } from "@/services/invoice/signer"

const TEST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <gEmisor>
    <dRUC>123456789-1-123456</dRUC>
    <dDV>12</dDV>
  </gEmisor>
  <gDocumento>
    <dTipoDoc>01</dTipoDoc>
    <dFolA>0001</dFolA>
  </gDocumento>
</rFE>`

export async function POST(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const signedXml = await signInvoiceXml(TEST_XML, session.user.organizationId)
    const hasSignature = signedXml.includes("<ds:Signature")

    return NextResponse.json({
      success: hasSignature,
      signedXml,
    })
  } catch (error) {
    console.error("[API] Error probando firma digital:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "No fue posible firmar el XML de prueba",
      },
      { status: 500 },
    )
  }
}


