import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"
import { NextResponse } from "next/server"
import { createInvoiceSchema, calculateInvoiceTotals, calculateItemTotals } from "@/lib/validations/invoice"
import { Decimal } from "@prisma/client/runtime/library"
import { InvoiceStatus } from "@prisma/client"

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
    const { saveAsDraft, ...invoiceData } = body

    // Validar con Zod
    const validationResult = createInvoiceSchema.safeParse(invoiceData)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { client, items, notes, paymentMethod } = validationResult.data

    // Calcular totales
    const totals = calculateInvoiceTotals(items)

    // Obtener un folio disponible (solo si no es borrador)
    let folioAssignment = null
    let folioNumber = null

    if (!saveAsDraft) {
      // Buscar una asignación de folios con disponibles
      folioAssignment = await prisma.folioAssignment.findFirst({
        where: {
          organizationId,
        },
        orderBy: {
          assignedAt: "desc",
        },
      })

      if (!folioAssignment) {
        return NextResponse.json(
          { error: "No hay folios disponibles. Debe comprar folios primero." },
          { status: 400 }
        )
      }

      const disponibles = folioAssignment.assignedAmount - folioAssignment.consumedAmount

      if (disponibles <= 0) {
        return NextResponse.json(
          { error: "No hay folios disponibles. Debe comprar más folios." },
          { status: 400 }
        )
      }

      // Generar número de folio
      const folioPool = await prisma.folioPool.findUnique({
        where: { id: folioAssignment.folioPoolId },
      })

      if (!folioPool || !folioPool.folioStart) {
        return NextResponse.json(
          { error: "Error al obtener información del pool de folios" },
          { status: 500 }
        )
      }

      // Calcular el siguiente número de folio
      const nextFolioIndex = folioAssignment.consumedAmount
      const startNumber = parseInt(folioPool.folioStart)
      folioNumber = `${startNumber + nextFolioIndex}`.padStart(8, "0")
    }

    // Crear la factura en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la factura
      const invoice = await tx.invoice.create({
        data: {
          organizationId,
          createdBy: session.user.id,
          clientReferenceId: `CLIENT-${Date.now()}`, // Temporal
          
          // Número de folio (solo si no es borrador)
          invoiceNumber: folioNumber,
          
          // Datos del emisor (temporal - obtener de la organización)
          issuerRuc: "0000000000",
          issuerDv: "00",
          issuerName: "Organización",
          issuerAddress: "Dirección",
          issuerEmail: "contacto@organizacion.com",
          
          // Información del receptor (cliente)
          receiverRuc: client.taxId,
          receiverDv: "00", // Calcular según normativa panameña
          receiverName: client.name,
          receiverEmail: client.email || null,
          receiverPhone: client.phone || null,
          receiverAddress: client.address,
          
          // Montos
          subtotal: new Decimal(totals.subtotal.toFixed(2)),
          discount: new Decimal(totals.totalDiscount.toFixed(2)),
          subtotalAfterDiscount: new Decimal((totals.subtotal - totals.totalDiscount).toFixed(2)),
          itbms: new Decimal(totals.totalTax.toFixed(2)),
          total: new Decimal(totals.total.toFixed(2)),
          
          // Información adicional
          notes,
          
          // Fechas
          issueDate: new Date(),
        },
      })

      // Crear los items de la factura
      await tx.invoiceItem.createMany({
        data: items.map((item, index) => {
          const itemTotals = calculateItemTotals(item)
          return {
            invoiceId: invoice.id,
            lineNumber: index + 1,
            code: `ITEM${index + 1}`,
            description: item.description,
            quantity: new Decimal(item.quantity.toFixed(4)),
            unitPrice: new Decimal(item.unitPrice.toFixed(2)),
            discount: new Decimal((item.quantity * item.unitPrice * item.discount / 100).toFixed(2)),
            discountRate: new Decimal(item.discount.toFixed(2)),
            taxRate: new Decimal(item.taxRate.toFixed(2)),
            taxAmount: new Decimal(itemTotals.taxAmount.toFixed(2)),
            subtotal: new Decimal(itemTotals.subtotal.toFixed(2)),
            total: new Decimal(itemTotals.total.toFixed(2)),
          }
        }),
      })

      // Si no es borrador, actualizar el consumo de folios
      if (!saveAsDraft && folioAssignment) {
        await tx.folioAssignment.update({
          where: { id: folioAssignment.id },
          data: {
            consumedAmount: folioAssignment.consumedAmount + 1,
          },
        })
      }

      return invoice
    })

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        action: saveAsDraft ? "INVOICE_DRAFT_CREATED" : "INVOICE_CREATED",
        entity: "Invoice",
        entityId: result.id,
        changes: JSON.stringify({
          invoiceNumber: folioNumber,
          total: totals.total,
          itemsCount: items.length,
        }),
        ip: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        invoiceNumber: result.invoiceNumber,
        total: result.total,
        status: result.status,
      },
    })
  } catch (error) {
    console.error("[API] Error al crear factura:", error)
    return NextResponse.json(
      { error: "Error al procesar la factura" },
      { status: 500 }
    )
  }
}

