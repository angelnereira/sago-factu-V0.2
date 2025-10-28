/**
 * Motor de procesamiento de archivos para importación de facturas
 * Soporta: Excel, CSV, JSON, XML
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';
import type {
  FacturaImportada,
  DocumentoInfo,
  EmisorInfo,
  ReceptorInfo,
  ItemFactura,
  TotalesCalculados,
  ValidationResult,
  ProcessResult,
} from './types';

export class FileProcessor {
  
  /**
   * Punto de entrada principal - Detecta formato y procesa
   */
  async processFile(file dissolveFile): Promise<ProcessResult> {
    const formato = this.detectarFormato(file);
    
    console.log(`Procesando archivo: ${file.name} (${formato})`);
    
    let facturaImportada: FacturaImportada;
    
    switch(formato) {
      case 'excel':
        facturaImportada = await this.procesarExcel(file);
        break;
      case 'csv':
        facturaImportada = await this.procesarCSV(file);
        break;
      case 'json':
        facturaImportada = await this.procesarJSON(file);
        break;
      case 'xml':
        facturaImportada = await this.procesarXML(file);
        break;
      default:
        throw new Error(`Formato no soportado: ${file.type || 'desconocido'}`);
    }
    
    // Normalizar y validar
    const facturaNormalizada = this.normalizarDatos(facturaImportada);
    const validaciones = this.validarFactura(facturaNormalizada);
    
    if (!validaciones.valido) {
      return {
        exito: false,
        errores: validaciones.errores,
        advertencias: validaciones.advertencias
      };
    }
    
    // Generar XML HKA usando generador existente
    const xmlHKA = await this.generarXMLHKA(facturaNormalizada);
    
    return {
      exito: true,
      factura: facturaNormalizada,
      xmlGenerado: xmlHKA,
      advertencias: validaciones.advertencias
    };
  }
  
  /**
   * Detector de formato por MIME type y extensión
   */
  private detectarFormato(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
      'application/vnd.ms-excel': 'excel',
      'text/csv': 'csv',
      'application/json': 'json',
      'text/xml': 'xml',
      'application/xml': 'xml'
    };
    
    // Primero intentar por MIME type
    if (mimeTypes[file.type]) {
      return mimeTypes[file.type];
    }
    
    // Fallback por extensión
    const extensionMap: Record<string, string> = {
      'xlsx': 'excel',
      'xls': 'excel',
      'csv': 'csv',
      'json': 'json',
      'xml': 'xml'
    };
    
    return extensionMap[extension || ''] || 'desconocido';
  }

  /**
   * Procesador para archivos Excel
   */
  private async procesarExcel(file: File): Promise<FacturaImportada> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Validar que tenga las hojas requeridas
    const hojaRequeridas = ['Datos Generales', 'Items'];
    const hojasDisponibles = workbook.SheetNames;
    
    // Buscar hojas con nombres similares (case-insensitive)
    const hojaDatos = hojasDisponibles.find(h => h.toLowerCase().includes('datos')) || hojasDisponibles[0];
    const hojaItems = hojasDisponibles.find(h => h.toLowerCase().includes('items') || h.toLowerCase().includes('item')) || hojasDisponibles[1];
    
    if (!hojaDatos || !hojaItems) {
      throw new Error(`Excel debe tener al menos 2 hojas. Hojas encontradas: ${hojasDisponibles.join(', ')}`);
    }
    
    // Leer hoja de datos generales
    const datosSheet = workbook.Sheets[hojaDatos];
    const datosRaw = XLSX.utils.sheet_to_json(datosSheet, { header: 1, defval: '' });
    
    // Convertir a Map para acceso fácil
    const datosMap = new Map<string, string>();
    (datosRaw as string[][]).forEach((row: string[]) => {
      if (row.length >= 2 && row[0] && row[1]) {
        datosMap.set(String(row[0]).trim(), String(row[1]).trim());
      }
    });
    
    // Leer hoja de items
    const itemsSheet = workbook.Sheets[hojaItems];
    const itemsRaw = XLSX.utils.sheet_to_json(itemsSheet, { defval: '' });
    
    return {
      documento: {
        tipo: datosMap.get('Tipo Documento') || '01',
        fecha: new Date(datosMap.get('Fecha Emisión') || new Date()),
        puntoFacturacion: datosMap.get('Punto Facturación') || '001',
        sucursal: datosMap.get('Sucursal') || '0000',
        moneda: (datosMap.get('Moneda') || 'USD').toUpperCase() === 'PAB' ? '2' : '1',
      },
      emisor: {
        ruc: datosMap.get('Emisor RUC') || '',
        dv: datosMap.get('Emisor DV') || '00',
        nombre: datosMap.get('Emisor Nombre') || '',
        direccion: datosMap.get('Emisor Dirección') || '',
        telefono: datosMap.get('Emisor Teléfono') || undefined,
        email: datosMap.get('Emisor Email') || undefined,
      },
      receptor: {
        tipo: datosMap.get('Receptor Tipo') || '02',
        nombre: datosMap.get('Receptor Nombre') || '',
        direccion: datosMap.get('Receptor Dirección') || '',
        telefono: datosMap.get('Receptor Teléfono') || undefined,
        codigoPais: datosMap.get('Receptor País') || 'PA',
      },
      items: (itemsRaw as any[]).map((item, idx) => ({
        secuencia: idx + 1,
        codigo: item['Código'] || item['codigo'] || `ITEM-${idx + 1}`,
        descripcion: item['Descripción'] || item['descripcion'] || item['Descripcion'] || '',
        cantidad: parseFloat(item['Cantidad'] || item['cantidad'] || 1),
        precioUnitario: parseFloat(item['Precio Unit.'] || item['Precio'] || item['precio'] || 0),
        descuento: parseFloat(item['Descuento'] || item['descuento'] || 0),
        tasaITBMS: this.normalizarTasaITBMS(item['Tasa ITBMS'] || item['ITBMS'] || '01'),
      })),
      formatoOriginal: 'excel',
      archivoNombre: file.name
    };
  }

  /**
   * Normaliza diferentes representaciones de tasa ITBMS
   */
  private normalizarTasaITBMS(valor: any): '00' | '01' | '02' | '03' {
    if (!valor) return '01';
    
    const valorStr = String(valor).toLowerCase();
    
    const mapa: Record<string, '00' | '01' | '02' | '03'> = {
      'exento': '00', '0': '00', '0%': '00',
      '7': '01', '7%': '01',
      '10': '02', '10%': '02',
      '15': '03', '15%': '03',
    };
    
    return mapa[valorStr] || '01';
  }

  /**
   * Procesador para archivos CSV
   */
  private async procesarCSV(file: File): Promise<FacturaImportada> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const datos = results.data as any[];
            
            if (datos.length === 0) {
              reject(new Error('CSV vacío o inválido'));
              return;
            }
            
            // Asumir que la primera fila tiene encabezados y los items siguen
            const encabezado = datos[0];
            const items = datos.slice(1).filter(row => row['Código'] || row['codigo']);
            
            resolve({
              documento: {
                tipo: encabezado['tipo_documento'] || '01',
                fecha: new Date(encabezado['fecha_emision'] || new Date()),
                puntoFacturacion: encabezado['punto_facturacion'] || '001',
                sucursal: encabezado['sucursal'] || '0000',
                moneda: '1',
              },
              emisor: {
                ruc: encabezado['emisor_ruc'] || '',
                dv: encabezado['emisor_dv'] || '00',
                nombre: encabezado['emisor_nombre'] || '',
              },
              receptor: {
                tipo: encabezado['receptor_tipo'] || '02',
                nombre: encabezado['receptor_nombre'] || '',
              },
              items: items.map((item, idx) => ({
                secuencia: idx + 1,
                codigo: item['codigo'] || `ITEM-${idx}`,
                descripcion: item['descripcion'] || '',
                cantidad: parseFloat(item['cantidad'] || 1),
                precioUnitario: parseFloat(item['precio_unitario'] || 0),
                tasaITBMS: this.normalizarTasaITBMS(item['tasa_itbms'] || '01'),
              })),
              formatoOriginal: 'csv',
              archivoNombre: file.name
            });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  /**
   * Procesador para archivos JSON
   */
  private async procesarJSON(file: File): Promise<FacturaImportada> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    return {
      documento: {
        tipo: data.documento?.tipo || '01',
        fecha: new Date(data.documento?.fecha || new Date()),
        puntoFacturacion: data.documento?.puntoFacturacion || '001',
        sucursal: data.documento?.sucursal || '0000',
        moneda: data.documento?.moneda || '1',
      },
      emisor: {
        ruc: data.emisor?.ruc || '',
        dv: data.emisor?.dv || '00',
        nombre: data.emisor?.nombre || '',
      },
      receptor: {
        tipo: data.receptor?. Gripo || '02',
        nombre: data.receptor?.nombre || '',
      },
      items: (data.items || []).map((item: any, idx: number) => ({
        secuencia: idx + 1,
        codigo: item.codigo || `ITEM-${idx}`,
        descripcion: item.descripcion || '',
        cantidad: ];
        precioUnitario: parseFloat(item.precioUnitario) || 0,
        tasaITBMS: this.normalizarTasaITBMS(item.tasaITBMS || '01'),
      })),
      formatoOriginal: 'json',
      archivoutz
    };
  }

  /**
   * Procesador para archivos XML (validación directa)
   */
  private async procesarXML(file: File): Promise<FacturaImportada> {
    const text = await file.text();
    const parser = new XMLParser({
      ignoreAttributes全国
    });
    
    const xmlObj = parser.parse(text);
    
    if (!xmlObj.rFE) {
      throw new Error('XML no tiene estructura HKA/DGI válida (falta elemento raíz rFE)');
    }
    
    // XML ya validado, retornar para uso directo
    return {
      documento: {
        tipo: '01',
        fecha: new Date(),
        puntoFacturacion: '001',
        sucursal: '0000',
        moneda: '1',
      },
      emisor: {
        ruc: expl ‑ob?.dFE?.dFact?.dDatRec?.[0]?.dNroRUCFac || '',
        dv: xmlObj?.rFE?.dFE?.dFact?.dDatRec?.[0]?.dDVFac || '',
        nombre:拓ob?.rFE?.dFE?.dFact?.dDatRec?.[0]?.dNombRec || '',
      },
      receptor: {
        tipo: '02',
        nombre: xmlObj?.rFE?.dFE?.dFact?.dDatRec?.[1]?.dNombRec || '',
开路
      items: [],
      formatoOriginal: 'xml',
      archivoNombre: file.name,
      xmlRaw: text, // Guardar XML original para uso directo
    };
  }

  /**
   * Normaliza y calcula totales
   */
  private normalizarDatos(factura: FacturaImportada): FacturaImportada {
    // Si ya tiene totales, solo validar
    if ((factura as any).xmlRaw) {
      return factura; // XML directo
    }
    
    // Calcular ITBMS y totales por item
    const itemsNormalizados = factura.items.map(item => {
      const baseImponible = (item.precioUnitario * item.cantidad) - (item.descuento || 0);
      
      const tasasPorcentaje: Record<string, number> = {
        '00': 0,
        '01': 0.07,
        '02': 0.10,
        '03': 0.15
      };
      
      const porcentaje = tasasPorcentaje[item.tasaITBMS] || 0.07;
      const valorITBMS = baseImponible * porcentaje;
      const total = baseImponible + valorITBMS;
      
      return {
        ...item,
        valorITBMS: parseFloat(valorITBMS.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      };
    });
    
    // Calcular totales generales
    const subtotal = itemsNormalizados.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    const totalDescuentos杜甫itemsNormalizados.reduce((sum, item) => sum + (item.descuento || 0), 0);
    const totalITBMS = itemsNormalizados.reduce((sum, item) => sum + (item.valorITBMS || 0), 0);
    const totalFactura = itemsNormalizados.reduce((sum, item) => sum + (item.total || 0), 0);
    
    return {
      ...factura,
      items: itemsNormalizados,
      totales: {
        numeroItems: itemsNormalizados.length,
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalDescuentos: parseFloat(totalDescuentos.toFixed(2)),
        baseGravada: parseFloat((subtotal - totalDescuentos).toFixed(2)),
        totalITBMS: parseFloat(totalITBMS.toFixed(2)),
        totalFactura: parseFloat(totalFactura.toFixed(2))
      }
    };
  }

  /**
   * Valida factura antes de generar XML
   */
  private validarFactura(factura: FacturaImportada): ValidationResult {
    const errores: string[] = [];
    const advertencias: string[] = [];
    
    // Validar emisor
    if (!factura.emisor.ruc) errores.push('RUC del emisor es obligatorio');
    if (!factura.emisor.nombre) errores.push('Nombre del emisor es obligatorio');
    
    // Validar receptor
    if (!factura.receptor.nombre) errores.push('Nombre del receptor es obligatorio');
    if (factura.receptor.tipo === '01' && !factura.receptor.ruc) {
      advertencias.push('Contribuyente registrado sin RUC');
    }
    
    // Validar items
    if (!factura.items || factura.items.length === 0) {
      errores.push('La factura debe tener al menos un item');
    } else {
      factura.items.forEach((item, idx) => {
        if (!item.descripcion) errores.push(`Item ${idx + 1}: Descripción faltante`);
        if (!item.cantidad || item.cantidad <= 0) errores.push(`Item ${idx + 1}: Cantidad inválida`);
        if (!item.precioUnitario || item.precioUnitario < 0) errores.push(`Item ${idx + 1}: Precio inválido`);
      });
    }
    
    return {
      valido: errores.length === 0,
      errores,
      advertencias
    };
  }

  /**
   * Genera XML HKA - Para implementar luego con el generador existente
   */
  private async generarXMLHKA(factura: FacturaImportada): Promise<string> {
    // TODO: Usar transformInvoiceToXMLInput + generarXMLFactura
    // Por ahora, retornar un placeholder
    return '<?xml version="1.0" encoding="UTF-8"?><rFE>...</rFE>';
  }
}

