/**
 * Parser de Excel para importar facturas
 * Soporta archivos .xlsx con diferentes formatos
 */

import * as XLSX from 'xlsx'
import type { ParsedInvoiceData } from './xml-parser'

export interface ExcelInvoiceData extends ParsedInvoiceData {
  // Heredamos de ParsedInvoiceData para mantener compatibilidad
}

export class InvoiceExcelParser {
  /**
   * Parsear archivo Excel y extraer datos de factura
   */
  async parse(fileBuffer: ArrayBuffer): Promise<ExcelInvoiceData> {
    try {
      // Leer el archivo Excel
      const workbook = XLSX.read(fileBuffer, { type: 'array' })
      
      // Obtener la primera hoja
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convertir a JSON
      const data: any[] = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false,
      })
      
      if (!data || data.length === 0) {
        throw new Error("El archivo Excel está vacío")
      }
      
      // Detectar formato del Excel
      return this.detectAndParse(data, worksheet)
      
    } catch (error: any) {
      throw new Error(`Error al procesar Excel: ${error.message}`)
    }
  }

  /**
   * Detectar formato y parsear
   */
  private detectAndParse(data: any[], worksheet: XLSX.WorkSheet): ExcelInvoiceData {
    // Convertir también a JSON con headers para análisis
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      blankrows: false,
    })
    
    // Intentar detectar formato basado en columnas
    const firstRow = jsonData[0]
    
    if (firstRow) {
      const keys = Object.keys(firstRow).map(k => k.toLowerCase())
      
      // Formato con headers conocidos
      if (this.hasClientHeaders(keys) || this.hasInvoiceHeaders(keys)) {
        return this.parseWithHeaders(jsonData)
      }
    }
    
    // Formato sin headers (datos directos)
    return this.parseWithoutHeaders(data)
  }

  /**
   * Verificar si tiene headers de cliente
   */
  private hasClientHeaders(keys: string[]): boolean {
    const clientKeys = ['nombre', 'name', 'cliente', 'customer', 'ruc', 'taxid']
    return keys.some(k => clientKeys.some(ck => k.includes(ck)))
  }

  /**
   * Verificar si tiene headers de factura
   */
  private hasInvoiceHeaders(keys: string[]): boolean {
    const invoiceKeys = ['descripcion', 'description', 'producto', 'product', 'cantidad', 'quantity', 'precio', 'price']
    return keys.some(k => invoiceKeys.some(ik => k.includes(ik)))
  }

  /**
   * Parsear con headers
   */
  private parseWithHeaders(data: any[]): ExcelInvoiceData {
    // Buscar información del cliente en las primeras filas
    const clientData = this.extractClientData(data)
    
    // Buscar items (productos/servicios)
    const items = this.extractItemsWithHeaders(data)
    
    // Buscar información adicional
    const additionalInfo = this.extractAdditionalInfo(data)
    
    return {
      client: clientData,
      items: items,
      notes: additionalInfo.notes,
      paymentMethod: additionalInfo.paymentMethod,
    }
  }

  /**
   * Parsear sin headers (formato simple)
   */
  private parseWithoutHeaders(data: any[]): ExcelInvoiceData {
    // Formato esperado:
    // Fila 1: Cliente
    // Fila 2: Datos del cliente
    // Fila 3: Headers de items
    // Fila 4+: Items
    
    let clientName = ""
    let clientTaxId = ""
    let clientEmail = ""
    let clientPhone = ""
    let clientAddress = ""
    
    // Buscar datos del cliente en las primeras filas
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const firstCell = String(row[0] || '').toLowerCase()
      
      if (firstCell.includes('cliente') || firstCell.includes('customer') || firstCell.includes('nombre')) {
        clientName = String(row[1] || '')
      } else if (firstCell.includes('ruc') || firstCell.includes('tax') || firstCell.includes('nit')) {
        clientTaxId = String(row[1] || '')
      } else if (firstCell.includes('email') || firstCell.includes('correo')) {
        clientEmail = String(row[1] || '')
      } else if (firstCell.includes('tel') || firstCell.includes('phone')) {
        clientPhone = String(row[1] || '')
      } else if (firstCell.includes('direc') || firstCell.includes('address')) {
        clientAddress = String(row[1] || '')
      }
    }
    
    // Buscar items (después de las primeras filas)
    const items = this.extractItemsWithoutHeaders(data)
    
    return {
      client: {
        name: clientName || "Cliente Genérico",
        taxId: clientTaxId || "000000000",
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress || "Panamá",
        city: "Panamá",
        country: "PA",
      },
      items: items.length > 0 ? items : [{
        description: "Item 1",
        quantity: 1,
        unitPrice: 0,
        taxRate: 7,
        discount: 0,
      }],
      notes: "",
      paymentMethod: "CASH",
    }
  }

  /**
   * Extraer datos del cliente
   */
  private extractClientData(data: any[]): ExcelInvoiceData['client'] {
    let clientData = {
      name: "",
      taxId: "",
      email: "",
      phone: "",
      address: "",
      city: "Panamá",
      country: "PA",
    }
    
    // Buscar en las primeras filas
    for (const row of data.slice(0, 10)) {
      for (const key in row) {
        const lowerKey = key.toLowerCase()
        const value = String(row[key] || '').trim()
        
        if (!value) continue
        
        // Nombre
        if ((lowerKey.includes('nombre') || lowerKey.includes('name') || lowerKey.includes('cliente') || lowerKey.includes('customer')) && !clientData.name) {
          clientData.name = value
        }
        // RUC/Tax ID
        else if ((lowerKey.includes('ruc') || lowerKey.includes('tax') || lowerKey.includes('nit') || lowerKey.includes('cedula')) && !clientData.taxId) {
          clientData.taxId = value
        }
        // Email
        else if (lowerKey.includes('email') || lowerKey.includes('correo')) {
          clientData.email = value
        }
        // Teléfono
        else if (lowerKey.includes('tel') || lowerKey.includes('phone') || lowerKey.includes('celular')) {
          clientData.phone = value
        }
        // Dirección
        else if (lowerKey.includes('direc') || lowerKey.includes('address')) {
          clientData.address = value
        }
        // Ciudad
        else if (lowerKey.includes('ciudad') || lowerKey.includes('city')) {
          clientData.city = value
        }
        // País
        else if (lowerKey.includes('pais') || lowerKey.includes('country')) {
          clientData.country = value
        }
      }
    }
    
    // Valores por defecto si no se encontraron
    if (!clientData.name) clientData.name = "Cliente Genérico"
    if (!clientData.taxId) clientData.taxId = "000000000"
    if (!clientData.address) clientData.address = "Panamá"
    
    return clientData
  }

  /**
   * Extraer items con headers
   */
  private extractItemsWithHeaders(data: any[]): ExcelInvoiceData['items'] {
    const items: ExcelInvoiceData['items'] = []
    
    for (const row of data) {
      const item = {
        description: "",
        quantity: 0,
        unitPrice: 0,
        taxRate: 7,
        discount: 0,
      }
      
      let hasItemData = false
      
      for (const key in row) {
        const lowerKey = key.toLowerCase()
        const value = row[key]
        
        // Descripción
        if (lowerKey.includes('descrip') || lowerKey.includes('product') || lowerKey.includes('item') || lowerKey.includes('servicio')) {
          item.description = String(value || '').trim()
          if (item.description) hasItemData = true
        }
        // Cantidad
        else if (lowerKey.includes('cantidad') || lowerKey.includes('quantity') || lowerKey.includes('cant') || lowerKey.includes('qty')) {
          item.quantity = parseFloat(value) || 0
          if (item.quantity > 0) hasItemData = true
        }
        // Precio unitario
        else if (lowerKey.includes('precio') || lowerKey.includes('price') || lowerKey.includes('valor') || lowerKey.includes('unit')) {
          item.unitPrice = parseFloat(value) || 0
          if (item.unitPrice > 0) hasItemData = true
        }
        // Tasa de impuesto
        else if (lowerKey.includes('impuesto') || lowerKey.includes('tax') || lowerKey.includes('itbms') || lowerKey.includes('iva')) {
          item.taxRate = parseFloat(value) || 7
        }
        // Descuento
        else if (lowerKey.includes('descuento') || lowerKey.includes('discount')) {
          item.discount = parseFloat(value) || 0
        }
      }
      
      // Solo agregar si tiene datos
      if (hasItemData && item.description) {
        items.push(item)
      }
    }
    
    return items.length > 0 ? items : [{
      description: "Item 1",
      quantity: 1,
      unitPrice: 0,
      taxRate: 7,
      discount: 0,
    }]
  }

  /**
   * Extraer items sin headers
   */
  private extractItemsWithoutHeaders(data: any[]): ExcelInvoiceData['items'] {
    const items: ExcelInvoiceData['items'] = []
    
    // Buscar fila de headers de items
    let itemsStartRow = -1
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const firstCell = String(row[0] || '').toLowerCase()
      if (firstCell.includes('descrip') || firstCell.includes('product') || firstCell.includes('item')) {
        itemsStartRow = i + 1
        break
      }
    }
    
    // Si no se encontró header, buscar desde la fila 5
    if (itemsStartRow === -1) {
      itemsStartRow = 5
    }
    
    // Extraer items
    for (let i = itemsStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length < 3) continue
      
      const description = String(row[0] || '').trim()
      if (!description) continue
      
      items.push({
        description: description,
        quantity: parseFloat(row[1]) || 1,
        unitPrice: parseFloat(row[2]) || 0,
        taxRate: parseFloat(row[3]) || 7,
        discount: parseFloat(row[4]) || 0,
      })
    }
    
    return items
  }

  /**
   * Extraer información adicional
   */
  private extractAdditionalInfo(data: any[]): { notes?: string; paymentMethod?: string } {
    let notes = ""
    let paymentMethod = "CASH"
    
    for (const row of data) {
      for (const key in row) {
        const lowerKey = key.toLowerCase()
        const value = String(row[key] || '').trim()
        
        if (!value) continue
        
        // Notas
        if (lowerKey.includes('nota') || lowerKey.includes('note') || lowerKey.includes('comentario') || lowerKey.includes('observ')) {
          notes = value
        }
        // Forma de pago
        else if (lowerKey.includes('pago') || lowerKey.includes('payment')) {
          const valueLower = value.toLowerCase()
          if (valueLower.includes('efectivo') || valueLower.includes('cash')) {
            paymentMethod = "CASH"
          } else if (valueLower.includes('tarjeta') || valueLower.includes('card')) {
            paymentMethod = "CARD"
          } else if (valueLower.includes('transfer') || valueLower.includes('ach')) {
            paymentMethod = "TRANSFER"
          } else if (valueLower.includes('cheque') || valueLower.includes('check')) {
            paymentMethod = "CHECK"
          }
        }
      }
    }
    
    return { notes, paymentMethod }
  }

  /**
   * Validar que el archivo Excel tiene la estructura mínima requerida
   */
  static validate(fileBuffer: ArrayBuffer): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Intentar leer el archivo
      const workbook = XLSX.read(fileBuffer, { type: 'array' })
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        errors.push("El archivo Excel no tiene hojas")
        return { valid: false, errors }
      }
      
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (!data || data.length === 0) {
        errors.push("La hoja de Excel está vacía")
        return { valid: false, errors }
      }
      
      if (data.length < 2) {
        errors.push("El archivo Excel debe tener al menos 2 filas de datos")
        return { valid: false, errors }
      }
      
      return {
        valid: errors.length === 0,
        errors,
      }
    } catch (error: any) {
      errors.push(`Error al validar Excel: ${error.message}`)
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
export function createExcelParser() {
  return new InvoiceExcelParser()
}

