/**
 * Generador de XML FEL (Factura Electrónica) para Panamá
 * 
 * Este módulo genera el XML conforme al estándar de facturación
 * electrónica de Panamá y los requerimientos de The Factory HKA.
 */

import { XMLBuilder } from "fast-xml-parser"

interface InvoiceData {
  invoiceNumber: string
  issueDate: string
  
  // Emisor (organización)
  issuer: {
    taxId: string
    name: string
    tradeName?: string
    address: string
    city: string
    country: string
    phone?: string
    email?: string
  }
  
  // Receptor (cliente)
  receiver: {
    taxId: string
    name: string
    address: string
    city: string
    country: string
    email?: string
    phone?: string
  }
  
  // Items
  items: Array<{
    lineNumber: number
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
    discountRate?: number
  }>
  
  // Totales
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  
  // Otros
  paymentMethod: string
  notes?: string
}

export class XMLFELGenerator {
  private builder: XMLBuilder

  constructor() {
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      format: true,
      suppressBooleanAttributes: false,
    })
  }

  /**
   * Genera el XML de una factura electrónica
   */
  generate(data: InvoiceData): string {
    const xml = {
      "?xml": {
        "@_version": "1.0",
        "@_encoding": "UTF-8",
      },
      rFE: {
        "@_xmlns": "http://dgi-fep.mef.gob.pa",
        "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@_version": "1.0",
        
        // Datos del documento
        dDoc: {
          dFechaEm: data.issueDate,
          dNaturaleza: "01", // 01 = Factura
          dTipoDoc: "01", // 01 = Factura de operación interna
          dNumDoc: data.invoiceNumber,
        },
        
        // Datos del emisor
        dEmi: {
          dRuc: data.issuer.taxId,
          dNombre: data.issuer.name,
          dNombreComercial: data.issuer.tradeName || data.issuer.name,
          dDireccion: data.issuer.address,
          dCiudad: data.issuer.city,
          dPais: data.issuer.country,
          dTelefono: data.issuer.phone || "",
          dCorreo: data.issuer.email || "",
        },
        
        // Datos del receptor
        dRec: {
          dRuc: data.receiver.taxId,
          dNombre: data.receiver.name,
          dDireccion: data.receiver.address,
          dCiudad: data.receiver.city,
          dPais: data.receiver.country,
          dTelefono: data.receiver.phone || "",
          dCorreo: data.receiver.email || "",
        },
        
        // Items del documento
        dItems: {
          dItem: data.items.map(item => ({
            dNumItem: item.lineNumber,
            dDescItem: item.description,
            dCantItem: item.quantity.toFixed(2),
            dPrecioItem: item.unitPrice.toFixed(2),
            dPrecioItemSinItbms: item.unitPrice.toFixed(2),
            dValorItem: (item.quantity * item.unitPrice).toFixed(2),
            dTasaItbms: item.taxRate.toFixed(2),
            dValorItbms: ((item.quantity * item.unitPrice) * (item.taxRate / 100)).toFixed(2),
            dValorTotalItem: ((item.quantity * item.unitPrice) * (1 + item.taxRate / 100)).toFixed(2),
          })),
        },
        
        // Totales
        dTot: {
          dSubTotal: data.subtotal.toFixed(2),
          dTotalDescuento: data.discountAmount.toFixed(2),
          dTotalItbms: data.taxAmount.toFixed(2),
          dTotalNeto: data.total.toFixed(2),
          dTotalAPagar: data.total.toFixed(2),
          dFormaPago: this.mapPaymentMethod(data.paymentMethod),
        },
        
        // Información adicional (opcional)
        ...(data.notes && {
          dInfo: {
            dTexto: data.notes,
          },
        }),
      },
    }

    return this.builder.build(xml)
  }

  /**
   * Mapea el método de pago a los códigos de Panamá
   */
  private mapPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      CASH: "01", // Efectivo
      CARD: "02", // Tarjeta de crédito/débito
      TRANSFER: "03", // Transferencia bancaria
      CHECK: "04", // Cheque
      OTHER: "99", // Otro
    }

    return methodMap[method] || "01"
  }

  /**
   * Valida que el XML generado sea válido
   */
  validate(xml: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Verificar que contiene los elementos requeridos
      const requiredElements = [
        "rFE",
        "dDoc",
        "dEmi",
        "dRec",
        "dItems",
        "dTot",
      ]

      for (const element of requiredElements) {
        if (!xml.includes(`<${element}`)) {
          errors.push(`Falta elemento requerido: ${element}`)
        }
      }

      // Verificar formato de RUC (debe tener 10-11 dígitos)
      const rucPattern = /<dRuc>(\d{10,11})<\/dRuc>/g
      const rucMatches = xml.match(rucPattern)
      if (!rucMatches || rucMatches.length < 2) {
        errors.push("RUC inválido o faltante")
      }

      // Verificar que los totales están presentes
      if (!xml.includes("<dTotalAPagar>")) {
        errors.push("Falta el total a pagar")
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    } catch (error: any) {
      return {
        valid: false,
        errors: [error.message],
      }
    }
  }
}

/**
 * Helper para generar XML desde una factura de la base de datos
 */
export async function generateXMLFromInvoice(invoice: any, organization: any): Promise<string> {
  const generator = new XMLFELGenerator()

  const invoiceData: InvoiceData = {
    invoiceNumber: invoice.invoiceNumber || "",
    issueDate: invoice.issueDate.toISOString().split("T")[0],
    
    issuer: {
      taxId: organization.taxId,
      name: organization.legalName,
      tradeName: organization.name,
      address: organization.address || "",
      city: organization.city || "Panamá",
      country: organization.country || "PA",
      phone: organization.phone || "",
      email: organization.email || "",
    },
    
    receiver: {
      taxId: invoice.clientTaxId,
      name: invoice.clientName,
      address: invoice.clientAddress,
      city: invoice.clientCity || "Panamá",
      country: invoice.clientCountry || "PA",
      email: invoice.clientEmail || "",
      phone: invoice.clientPhone || "",
    },
    
    items: invoice.items.map((item: any) => ({
      lineNumber: item.lineNumber,
      description: item.description,
      quantity: parseFloat(item.quantity.toString()),
      unitPrice: parseFloat(item.unitPrice.toString()),
      taxRate: parseFloat(item.taxRate.toString()),
      discountRate: parseFloat(item.discountRate?.toString() || "0"),
    })),
    
    subtotal: parseFloat(invoice.subtotal.toString()),
    discountAmount: parseFloat(invoice.discountAmount.toString()),
    taxAmount: parseFloat(invoice.taxAmount.toString()),
    total: parseFloat(invoice.total.toString()),
    
    paymentMethod: invoice.paymentMethod,
    notes: invoice.notes || undefined,
  }

  return generator.generate(invoiceData)
}

