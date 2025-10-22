/**
 * Parser de XML para importar facturas
 * Soporta múltiples formatos de XML de facturación electrónica
 */

import { XMLParser } from "fast-xml-parser"

export interface ParsedInvoiceData {
  // Cliente
  client: {
    name: string
    taxId: string
    email?: string
    phone?: string
    address: string
    city?: string
    country?: string
  }
  
  // Items
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
    discount: number
  }>
  
  // Información adicional
  notes?: string
  paymentMethod?: string
  issueDate?: Date
  dueDate?: Date
}

export class InvoiceXMLParser {
  private parser: XMLParser

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
      trimValues: true,
    })
  }

  /**
   * Parsear XML y extraer datos de factura
   */
  async parse(xmlContent: string): Promise<ParsedInvoiceData> {
    try {
      const parsed = this.parser.parse(xmlContent)
      
      // Detectar formato del XML
      if (parsed.rFE) {
        // Formato FEL de Panamá
        return this.parseFELPanama(parsed.rFE)
      } else if (parsed.Invoice || parsed.invoice) {
        // Formato genérico
        return this.parseGenericInvoice(parsed.Invoice || parsed.invoice)
      } else if (parsed["cfdi:Comprobante"]) {
        // Formato CFDI México
        return this.parseCFDI(parsed["cfdi:Comprobante"])
      } else {
        throw new Error("Formato de XML no reconocido")
      }
    } catch (error: any) {
      throw new Error(`Error al parsear XML: ${error.message}`)
    }
  }

  /**
   * Parsear formato FEL de Panamá
   */
  private parseFELPanama(rFE: any): ParsedInvoiceData {
    const receptor = rFE.dRec || {}
    const items = Array.isArray(rFE.dItems?.dItem) 
      ? rFE.dItems.dItem 
      : [rFE.dItems?.dItem].filter(Boolean)

    return {
      client: {
        name: receptor.dNombre || "",
        taxId: receptor.dRuc || "",
        email: receptor.dCorreo || "",
        phone: receptor.dTelefono || "",
        address: receptor.dDireccion || "",
        city: receptor.dCiudad || "Panamá",
        country: receptor.dPais || "PA",
      },
      items: items.map((item: any, index: number) => ({
        description: item.dDescItem || `Item ${index + 1}`,
        quantity: parseFloat(item.dCantItem || "1"),
        unitPrice: parseFloat(item.dPrecioItem || "0"),
        taxRate: parseFloat(item.dTasaItbms || "7"),
        discount: 0, // El formato FEL no incluye descuento por item
      })),
      notes: rFE.dInfo?.dTexto || "",
      paymentMethod: this.mapPaymentMethodFromCode(rFE.dTot?.dFormaPago || "01"),
    }
  }

  /**
   * Parsear formato genérico de factura
   */
  private parseGenericInvoice(invoice: any): ParsedInvoiceData {
    const customer = invoice.Customer || invoice.customer || {}
    const items = Array.isArray(invoice.Items?.Item || invoice.items?.item)
      ? (invoice.Items?.Item || invoice.items?.item)
      : [invoice.Items?.Item || invoice.items?.item].filter(Boolean)

    return {
      client: {
        name: customer.Name || customer.name || "",
        taxId: customer.TaxID || customer.taxId || customer.RUC || customer.ruc || "",
        email: customer.Email || customer.email || "",
        phone: customer.Phone || customer.phone || "",
        address: customer.Address || customer.address || "",
        city: customer.City || customer.city || "Panamá",
        country: customer.Country || customer.country || "PA",
      },
      items: items.map((item: any, index: number) => ({
        description: item.Description || item.description || `Item ${index + 1}`,
        quantity: parseFloat(item.Quantity || item.quantity || "1"),
        unitPrice: parseFloat(item.UnitPrice || item.unitPrice || item.Price || item.price || "0"),
        taxRate: parseFloat(item.TaxRate || item.taxRate || item.VAT || item.vat || "7"),
        discount: parseFloat(item.Discount || item.discount || "0"),
      })),
      notes: invoice.Notes || invoice.notes || "",
      paymentMethod: invoice.PaymentMethod || invoice.paymentMethod || "CASH",
    }
  }

  /**
   * Parsear formato CFDI de México
   */
  private parseCFDI(comprobante: any): ParsedInvoiceData {
    const receptor = comprobante["cfdi:Receptor"] || {}
    const conceptos = Array.isArray(comprobante["cfdi:Conceptos"]?.["cfdi:Concepto"])
      ? comprobante["cfdi:Conceptos"]["cfdi:Concepto"]
      : [comprobante["cfdi:Conceptos"]?.["cfdi:Concepto"]].filter(Boolean)

    return {
      client: {
        name: receptor["@_Nombre"] || "",
        taxId: receptor["@_Rfc"] || "",
        email: "",
        phone: "",
        address: "",
        city: "Ciudad de México",
        country: "MX",
      },
      items: conceptos.map((concepto: any, index: number) => ({
        description: concepto["@_Descripcion"] || `Item ${index + 1}`,
        quantity: parseFloat(concepto["@_Cantidad"] || "1"),
        unitPrice: parseFloat(concepto["@_ValorUnitario"] || "0"),
        taxRate: 16, // IVA México
        discount: parseFloat(concepto["@_Descuento"] || "0"),
      })),
      notes: "",
      paymentMethod: this.mapCFDIPaymentMethod(comprobante["@_FormaPago"]),
    }
  }

  /**
   * Mapear código de forma de pago a nuestro sistema
   */
  private mapPaymentMethodFromCode(code: string): string {
    const methodMap: Record<string, string> = {
      "01": "CASH",
      "02": "CARD",
      "03": "TRANSFER",
      "04": "CHECK",
      "99": "OTHER",
    }
    return methodMap[code] || "CASH"
  }

  /**
   * Mapear forma de pago CFDI
   */
  private mapCFDIPaymentMethod(formaPago: string): string {
    if (formaPago?.includes("01")) return "CASH"
    if (formaPago?.includes("02")) return "CHECK"
    if (formaPago?.includes("03")) return "TRANSFER"
    if (formaPago?.includes("04")) return "CARD"
    return "CASH"
  }

  /**
   * Validar que el XML tiene la estructura mínima requerida
   */
  static validate(xmlContent: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Verificar que es XML válido
      const parser = new XMLParser()
      const parsed = parser.parse(xmlContent)

      if (!parsed || Object.keys(parsed).length === 0) {
        errors.push("El XML está vacío o no es válido")
      }

      // Verificar que tiene algún formato reconocible
      const hasKnownFormat = 
        parsed.rFE || 
        parsed.Invoice || 
        parsed.invoice || 
        parsed["cfdi:Comprobante"]

      if (!hasKnownFormat) {
        errors.push("Formato de XML no reconocido. Formatos soportados: FEL Panamá, CFDI México, XML genérico")
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    } catch (error: any) {
      errors.push(`XML inválido: ${error.message}`)
      return {
        valid: false,
        errors,
      }
    }
  }
}

/**
 * Helper para crear una instancia del parser
 */
export function createInvoiceParser() {
  return new InvoiceXMLParser()
}

