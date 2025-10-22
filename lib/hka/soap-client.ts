/**
 * Cliente SOAP para The Factory HKA
 * 
 * Este cliente maneja la comunicación con el servicio SOAP de HKA
 * para el envío y consulta de documentos electrónicos en Panamá.
 * 
 * @see https://thefactoryhka.com.pa/documentacion-api
 */

import { XMLParser, XMLBuilder } from "fast-xml-parser"

interface HKAConfig {
  wsdlUrl: string
  username: string
  password: string
  environment: "demo" | "production"
}

interface HKAInvoiceData {
  invoiceNumber: string
  issueDate: string
  clientName: string
  clientTaxId: string
  clientAddress: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
  }>
  subtotal: number
  taxAmount: number
  total: number
}

interface HKAResponse {
  success: boolean
  cufe?: string // Código Único de Factura Electrónica
  qrCode?: string
  authorizationNumber?: string
  error?: string
  details?: any
}

export class HKASOAPClient {
  private config: HKAConfig
  private parser: XMLParser
  private builder: XMLBuilder

  constructor(config: HKAConfig) {
    this.config = config
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    })
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      format: true,
    })
  }

  /**
   * Envía un documento electrónico a HKA
   */
  async enviarDocumento(xmlContent: string): Promise<HKAResponse> {
    try {
      // Construir el SOAP envelope
      const soapEnvelope = this.buildSOAPEnvelope("enviarDocumento", {
        usuario: this.config.username,
        clave: this.config.password,
        xml: Buffer.from(xmlContent).toString("base64"),
      })

      // Realizar la petición HTTP
      const response = await fetch(this.config.wsdlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "enviarDocumento",
        },
        body: soapEnvelope,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseText = await response.text()
      const parsedResponse = this.parser.parse(responseText)

      // Extraer datos de la respuesta
      const result = this.extractResult(parsedResponse, "enviarDocumento")

      if (result.error) {
        return {
          success: false,
          error: result.error,
          details: result,
        }
      }

      return {
        success: true,
        cufe: result.cufe,
        qrCode: result.codigoQR,
        authorizationNumber: result.numeroAutorizacion,
        details: result,
      }
    } catch (error: any) {
      console.error("[HKA] Error al enviar documento:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Consulta el estado de un documento
   */
  async consultarDocumento(cufe: string): Promise<HKAResponse> {
    try {
      const soapEnvelope = this.buildSOAPEnvelope("consultarDocumento", {
        usuario: this.config.username,
        clave: this.config.password,
        cufe,
      })

      const response = await fetch(this.config.wsdlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "consultarDocumento",
        },
        body: soapEnvelope,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseText = await response.text()
      const parsedResponse = this.parser.parse(responseText)
      const result = this.extractResult(parsedResponse, "consultarDocumento")

      return {
        success: !result.error,
        error: result.error,
        details: result,
      }
    } catch (error: any) {
      console.error("[HKA] Error al consultar documento:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Obtiene el XML certificado de un documento
   */
  async obtenerXMLCertificado(cufe: string): Promise<string | null> {
    try {
      const soapEnvelope = this.buildSOAPEnvelope("obtenerXML", {
        usuario: this.config.username,
        clave: this.config.password,
        cufe,
      })

      const response = await fetch(this.config.wsdlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "obtenerXML",
        },
        body: soapEnvelope,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseText = await response.text()
      const parsedResponse = this.parser.parse(responseText)
      const result = this.extractResult(parsedResponse, "obtenerXML")

      if (result.xml) {
        return Buffer.from(result.xml, "base64").toString("utf-8")
      }

      return null
    } catch (error: any) {
      console.error("[HKA] Error al obtener XML:", error)
      return null
    }
  }

  /**
   * Obtiene el PDF de un documento
   */
  async obtenerPDF(cufe: string): Promise<Buffer | null> {
    try {
      const soapEnvelope = this.buildSOAPEnvelope("obtenerPDF", {
        usuario: this.config.username,
        clave: this.config.password,
        cufe,
      })

      const response = await fetch(this.config.wsdlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "obtenerPDF",
        },
        body: soapEnvelope,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseText = await response.text()
      const parsedResponse = this.parser.parse(responseText)
      const result = this.extractResult(parsedResponse, "obtenerPDF")

      if (result.pdf) {
        return Buffer.from(result.pdf, "base64")
      }

      return null
    } catch (error: any) {
      console.error("[HKA] Error al obtener PDF:", error)
      return null
    }
  }

  /**
   * Construye el SOAP envelope
   */
  private buildSOAPEnvelope(method: string, params: Record<string, any>): string {
    const envelope = {
      "soap:Envelope": {
        "@_xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "@_xmlns:hka": "http://thefactoryhka.com.pa/",
        "soap:Header": {},
        "soap:Body": {
          [`hka:${method}`]: params,
        },
      },
    }

    return this.builder.build(envelope)
  }

  /**
   * Extrae el resultado de una respuesta SOAP
   */
  private extractResult(parsedResponse: any, method: string): any {
    try {
      const body = parsedResponse?.["soap:Envelope"]?.["soap:Body"]
      const response = body?.[`hka:${method}Response`]
      const result = response?.[`${method}Result`]
      
      return result || {}
    } catch (error) {
      console.error("[HKA] Error al extraer resultado:", error)
      return { error: "Error al procesar respuesta" }
    }
  }
}

/**
 * Crear instancia del cliente HKA desde variables de entorno
 */
export function createHKAClient(): HKASOAPClient {
  const environment = (process.env.HKA_ENVIRONMENT as "demo" | "production") || "demo"
  
  const config: HKAConfig = {
    wsdlUrl: environment === "demo"
      ? process.env.HKA_DEMO_WSDL_URL || "https://demo.thefactoryhka.com.pa/ws/v1.0"
      : process.env.HKA_PROD_WSDL_URL || "https://api.thefactoryhka.com.pa/ws/v1.0",
    username: environment === "demo"
      ? process.env.HKA_DEMO_USERNAME || ""
      : process.env.HKA_PROD_USERNAME || "",
    password: environment === "demo"
      ? process.env.HKA_DEMO_PASSWORD || ""
      : process.env.HKA_PROD_PASSWORD || "",
    environment,
  }

  return new HKASOAPClient(config)
}

