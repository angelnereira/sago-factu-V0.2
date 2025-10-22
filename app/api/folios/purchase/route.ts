import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: "Usuario sin organización asignada" },
        { status: 400 }
      )
    }

    // Obtener datos del request
    const body = await request.json()
    const { quantity } = body

    // Validaciones
    if (!quantity || quantity < 1 || quantity > 10000) {
      return NextResponse.json(
        { error: "Cantidad inválida (mínimo 1, máximo 10,000)" },
        { status: 400 }
      )
    }

    // Calcular monto de compra
    const pricePerFolio = 0.06
    const purchaseAmount = quantity * pricePerFolio

    // Generar rango de folios
    const timestamp = Date.now()
    const folioStart = `${timestamp}`.padStart(8, "0")
    const folioEnd = `${timestamp + quantity - 1}`.padStart(8, "0")

    // Crear pool de folios en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el pool
      const folioPool = await tx.folioPool.create({
        data: {
          batchNumber: `BATCH-${timestamp}`,
          totalFolios: quantity,
          availableFolios: quantity,
          purchaseAmount,
          folioStart,
          folioEnd,
          hkaInvoiceNumber: `HKA-INV-${timestamp}`,
        },
      })

      // Crear asignación de folios (un registro por pool para la organización)
      const assignment = await tx.folioAssignment.create({
        data: {
          organizationId,
          folioPoolId: folioPool.id,
          assignedAmount: quantity,
          consumedAmount: 0,
          alertThreshold: 20, // Alertar cuando quede menos del 20%
          alertSent: false,
        },
      })

      return { folioPool, assignment }
    })

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        action: "FOLIO_PURCHASE",
        entity: "FolioPool",
        entityId: result.folioPool.id,
        changes: JSON.stringify({
          organizationId,
          quantity,
          folioStart,
          folioEnd,
          purchaseAmount,
        }),
        ip: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        poolId: result.folioPool.id,
        assignmentId: result.assignment.id,
        folioStart,
        folioEnd,
        quantity,
        purchaseAmount,
      },
    })
  } catch (error) {
    console.error("[API] Error al comprar folios:", error)
    return NextResponse.json(
      { error: "Error al procesar la compra de folios" },
      { status: 500 }
    )
  }
}

