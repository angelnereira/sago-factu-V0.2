// ============================================
// TRANSFORMER: INVOICE (PRISMA) → XML INPUT
// ============================================
// Convierte un Invoice de Prisma con sus relaciones
// al formato FacturaElectronicaInput para el generador XML

import { Invoice, InvoiceItem, Organization, Customer } from '@prisma/client';
import {
  FacturaElectronicaInput,
  EmisorData,
  ReceptorData,
  ItemFactura,
  TipoDocumento,
  TipoAmbiente,
  TipoEmision,
  TipoRUC,
  TipoCliente,
  FormaPago,
  TasaITBMS,
  calcularTotales,
} from '../xml/generator';

// ============================================
// TIPO PARA INVOICE CON RELACIONES
// ============================================

export type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[];
  organization: Organization;
  // Customer puede venir de 2 formas:
  // 1. Relación directa (si agregamos el campo en el schema)
  // 2. Buscado por clientReferenceId
  customer?: Customer;
};

// ============================================
// FUNCIÓN PRINCIPAL DE TRANSFORMACIÓN
// ============================================

export function transformInvoiceToXMLInput(
  invoice: InvoiceWithRelations,
  customer?: Customer
): FacturaElectronicaInput {
  // Si no viene customer en las relaciones, usar el parámetro
  const clienteData = invoice.customer || customer;
  
  if (!clienteData) {
    throw new Error('Customer data is required for XML transformation');
  }
  
  // ============================================
  // TRANSFORMAR DATOS DEL EMISOR
  // ============================================
  const emisor: EmisorData = {
    tipoRuc: mapTipoRUC(invoice.organization.rucType),
    ruc: invoice.issuerRuc || invoice.organization.ruc || '0000000000',
    dv: invoice.issuerDv || invoice.organization.dv || '00',
    razonSocial: invoice.issuerName || invoice.organization.name,
    nombreComercial: invoice.organization.tradeName || undefined,
    codigoSucursal: invoice.organization.branchCode || '0000',
    puntoFacturacion: invoice.pointOfSale || '001',
    direccion: invoice.issuerAddress || invoice.organization.address || 'PANAMA',
    codigoUbicacion: invoice.organization.locationCode || '1-1-1',
    provincia: invoice.organization.province || 'PANAMA',
    distrito: invoice.organization.district || 'PANAMA',
    corregimiento: invoice.organization.corregimiento || 'SAN FELIPE',
    telefono: invoice.organization.phone || undefined,
    correo: invoice.issuerEmail || invoice.organization.email || undefined,
  };
  
  // ============================================
  // TRANSFORMAR DATOS DEL RECEPTOR (CLIENTE)
  // ============================================
  const receptor: ReceptorData = {
    tipoRuc: mapTipoRUC(clienteData.rucType),
    ruc: clienteData.ruc,
    dv: clienteData.dv,
    tipoCliente: mapTipoCliente(clienteData.clientType),
    razonSocial: clienteData.name,
    direccion: clienteData.address,
    codigoUbicacion: clienteData.locationCode || undefined,
    provincia: clienteData.province || undefined,
    distrito: clienteData.district || undefined,
    corregimiento: clienteData.corregimiento || undefined,
    paisCodigo: clienteData.countryCode || 'PA',
    telefono: clienteData.phone || undefined,
    correo: clienteData.email || undefined,
  };
  
  // ============================================
  // TRANSFORMAR ITEMS DE FACTURA
  // ============================================
  const items: ItemFactura[] = invoice.items.map((item, index) => {
    // 🔧 FIX: Convertir Decimal a number para mapear correctamente
    const taxRateNumber = Number(item.taxRate);
    const tasaITBMS = mapTasaITBMS(taxRateNumber);
    
    // Calcular valores
    const precioUnitario = Number(item.unitPrice);
    const precioUnitarioDescuento = item.discountedPrice 
      ? Number(item.discountedPrice) 
      : precioUnitario;
    const cantidad = Number(item.quantity);
    const precioItem = Number(item.subtotal); // Precio total sin impuestos
    const valorITBMS = Number(item.taxAmount);
    const valorTotal = precioItem + valorITBMS;
    
    // 🔧 FIX: Si la tasa es EXENTO (00), el valor ITBMS DEBE ser 0
    const valorITBMSFinal = tasaITBMS === TasaITBMS.EXENTO ? 0 : valorITBMS;
    
    return {
      secuencia: item.lineNumber || (index + 1),
      descripcion: item.description,
      codigo: item.code || `PROD-${index + 1}`,
      codigoCPBS: undefined, // Opcional, si lo tienes en el schema agregarlo
      unidadMedida: item.unit || 'und',
      cantidad,
      precioUnitario,
      precioUnitarioDescuento,
      precioItem,
      valorTotal,
      tasaITBMS,
      valorITBMS: valorITBMSFinal, // ✅ Asegurar consistencia
      tasaISC: 0, // ISC no implementado por ahora
      valorISC: 0,
    };
  });
  
  // ============================================
  // CALCULAR TOTALES AUTOMÁTICAMENTE
  // ============================================
  const tiempoPago = mapTiempoPago(invoice.paymentTerm);
  const totales = calcularTotales(items, tiempoPago);
  
  // ============================================
  // GENERAR CÓDIGO DE SEGURIDAD SI NO EXISTE
  // ============================================
  const codigoSeguridad = invoice.securityCode || 
    String(Math.floor(Math.random() * 900000000) + 100000000);
  
  // ============================================
  // DETERMINAR AMBIENTE (DEMO O PRODUCCIÓN)
  // ============================================
  const ambiente = process.env.HKA_ENVIRONMENT === 'prod' 
    ? TipoAmbiente.PRODUCCION 
    : TipoAmbiente.DEMO;
  
  // ============================================
  // CONSTRUIR INPUT FINAL
  // ============================================
  const facturaInput: FacturaElectronicaInput = {
    // Información General
    ambiente,
    tipoEmision: TipoEmision.NORMAL,
    tipoDocumento: mapTipoDocumento(invoice.documentType),
    numeroDocumento: invoice.invoiceNumber || 'TEMP-' + Date.now(),
    puntoFacturacion: invoice.pointOfSale || '001',
    codigoSeguridad,
    fechaEmision: invoice.issueDate,
    fechaSalida: invoice.deliveryDate || invoice.issueDate,
    
    // Naturaleza de la operación
    naturalezaOperacion: '01', // 01 = Venta
    tipoOperacion: '1', // 1 = Compra-venta
    destino: '1', // 1 = Panamá
    
    // Forma de pago
    formaPago: mapFormaPago(invoice.paymentMethod),
    entregaCAFE: '2', // 2 = No requiere CAFE
    
    // Tipo de transacción
    tipoTransaccion: '1', // 1 = Venta de bienes y servicios
    tipoSucursal: '1', // 1 = Sucursal
    
    // Información adicional
    infoInteres: invoice.notes || undefined,
    
    // Partes
    emisor,
    receptor,
    
    // Items
    items,
    
    // Totales
    totales,
  };
  
  return facturaInput;
}

// ============================================
// FUNCIONES DE MAPEO DE TIPOS
// ============================================

function mapTipoRUC(rucType: string): TipoRUC {
  const map: Record<string, TipoRUC> = {
    '1': TipoRUC.PERSONA_NATURAL,
    '2': TipoRUC.PERSONA_JURIDICA,
    '3': TipoRUC.EXTRANJERO,
  };
  return map[rucType] || TipoRUC.PERSONA_JURIDICA;
}

function mapTipoCliente(clientType: string): TipoCliente {
  const map: Record<string, TipoCliente> = {
    '01': TipoCliente.CONTRIBUYENTE,
    '02': TipoCliente.CONSUMIDOR_FINAL,
    '03': TipoCliente.GOBIERNO,
    '04': TipoCliente.EXENTO,
  };
  return map[clientType] || TipoCliente.CONTRIBUYENTE;
}

function mapTipoDocumento(documentType: string): TipoDocumento {
  const map: Record<string, TipoDocumento> = {
    '01': TipoDocumento.FACTURA,
    'FACTURA': TipoDocumento.FACTURA,
    '02': TipoDocumento.NOTA_CREDITO,
    'NOTA_CREDITO': TipoDocumento.NOTA_CREDITO,
    '03': TipoDocumento.NOTA_DEBITO,
    'NOTA_DEBITO': TipoDocumento.NOTA_DEBITO,
    '04': TipoDocumento.NOTA_ENTREGA,
    'NOTA_ENTREGA': TipoDocumento.NOTA_ENTREGA,
    '05': TipoDocumento.EXPORTACION,
    'EXPORTACION': TipoDocumento.EXPORTACION,
  };
  return map[documentType] || TipoDocumento.FACTURA;
}

function mapFormaPago(paymentMethod: string): FormaPago {
  const map: Record<string, FormaPago> = {
    'CASH': FormaPago.EFECTIVO,
    'EFECTIVO': FormaPago.EFECTIVO,
    'CHECK': FormaPago.CHEQUE,
    'CHEQUE': FormaPago.CHEQUE,
    'TRANSFER': FormaPago.TRANSFERENCIA,
    'TRANSFERENCIA': FormaPago.TRANSFERENCIA,
    'CREDIT_CARD': FormaPago.TARJETA_CREDITO,
    'TARJETA_CREDITO': FormaPago.TARJETA_CREDITO,
    'DEBIT_CARD': FormaPago.TARJETA_DEBITO,
    'TARJETA_DEBITO': FormaPago.TARJETA_DEBITO,
    'OTHER': FormaPago.OTROS,
    'OTROS': FormaPago.OTROS,
  };
  return map[paymentMethod] || FormaPago.EFECTIVO;
}

function mapTasaITBMS(taxRate: number): TasaITBMS {
  // Normalizar la tasa (puede venir como 7 o 0.07)
  const tasa = taxRate > 1 ? taxRate : taxRate * 100;
  
  if (tasa === 0) return TasaITBMS.EXENTO;
  if (tasa === 7) return TasaITBMS.TARIFA_7;
  if (tasa === 10) return TasaITBMS.TARIFA_10;
  if (tasa === 15) return TasaITBMS.TARIFA_15;
  
  // Por defecto, si no coincide con ninguna tasa, usar EXENTO
  return TasaITBMS.EXENTO;
}

function mapTiempoPago(paymentTerm: string): number {
  // 1 = Contado, 2 = Crédito
  const map: Record<string, number> = {
    'CASH': 1,
    'CONTADO': 1,
    'CREDIT': 2,
    'CREDITO': 2,
  };
  return map[paymentTerm] || 1;
}

// ============================================
// FUNCIÓN HELPER: TRANSFORMAR Y GENERAR XML
// ============================================

import { generarXMLFactura, validarDatosFactura } from '../xml/generator';

export async function generateXMLFromInvoice(
  invoice: InvoiceWithRelations,
  customer?: Customer
): Promise<{ xml: string; cufe: string; errores: string[] }> {
  // Transformar Invoice a XML Input
  const xmlInput = transformInvoiceToXMLInput(invoice, customer);
  
  // Validar datos
  const errores = validarDatosFactura(xmlInput);
  
  if (errores.length > 0) {
    return {
      xml: '',
      cufe: '',
      errores,
    };
  }
  
  // Generar XML
  const xml = generarXMLFactura(xmlInput);
  
  // Extraer CUFE del XML
  const cufeMatch = xml.match(/<dId>(.*?)<\/dId>/);
  const cufe = cufeMatch ? cufeMatch[1] : '';
  
  return {
    xml,
    cufe,
    errores: [],
  };
}

