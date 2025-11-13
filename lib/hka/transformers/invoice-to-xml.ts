// ============================================
// TRANSFORMER: INVOICE (PRISMA) → XML INPUT
// ============================================
// Convierte un Invoice de Prisma con sus relaciones
// al formato FacturaElectronicaInput para el generador XML

import { Invoice, InvoiceItem, Organization, Customer, ReceiverType } from '@prisma/client';
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
import { getUbicacionOrDefault } from '../constants/ubicaciones-panama';
import { hkaLogger } from '../utils/logger';
import { validarFormatoRUC, calcularDigitoVerificador } from '@/lib/validations/ruc-validator';
import {
  normalizeInvoiceItem,
  normalizePrecioUnitario,
  normalizePrecioItem,
} from '../data-normalizer';

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
  // IMPORTANTE: Todos los campos críticos deben tener valores válidos según documentación HKA
  // Si faltan, usar valores por defecto para evitar errores de NullReference en HKA
  
  // Determinar ambiente para usar RUC demo si es necesario
  const ambienteOrg = (invoice.organization.hkaEnvironment || 'demo').toLowerCase();
  const isDemo = ambienteOrg === 'demo';
  
  // Obtener RUC válido (demo o producción)
  const orgRuc = invoice.organization.ruc?.trim() || null;
  const orgDv = invoice.organization.dv?.trim() || null;
  const invoiceRuc = invoice.issuerRuc?.trim() || null;
  const invoiceDv = invoice.issuerDv?.trim() || null;

  const { ruc: emisorRuc, dv: emisorDv } = getValidRUC(
    orgRuc || invoiceRuc,
    orgDv || invoiceDv,
    isDemo
  );
  
  // Obtener ubicación válida usando catálogo
  const ubicacionEmisor = getUbicacionOrDefault(invoice.organization.locationCode);
  
  const emisor: EmisorData = {
    tipoRuc: mapTipoRUC(invoice.organization.rucType || '2'), // Default: Persona Jurídica
    ruc: emisorRuc,
    dv: emisorDv,
    razonSocial: invoice.issuerName || invoice.organization.name || 'EMISOR SIN NOMBRE', // CRÍTICO: debe tener valor
    nombreComercial: invoice.organization.tradeName || undefined,
    codigoSucursal: invoice.organization.branchCode || '0000',
    puntoFacturacion: invoice.pointOfSale || '001',
    direccion: invoice.issuerAddress || invoice.organization.address || 'PANAMA', // CRÍTICO: debe tener valor
    codigoUbicacion: ubicacionEmisor.codigo,
    provincia: ubicacionEmisor.provincia,
    distrito: ubicacionEmisor.distrito,
    corregimiento: ubicacionEmisor.corregimiento,
    telefono: invoice.organization.phone || undefined,
    correo: invoice.issuerEmail || invoice.organization.email || undefined,
  };
  
  // Log warning si se usa RUC demo
  if (isDemo) {
    hkaLogger.warn('USING_DEMO_RUC', `Usando RUC demo para ambiente DEMO: ${emisorRuc}`, {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      data: { ruc: emisorRuc, ambiente: ambienteOrg },
    });
  }
  
  // ============================================
  // TRANSFORMAR DATOS DEL RECEPTOR (CLIENTE)
  // ============================================
  // IMPORTANTE: Todos los campos críticos deben tener valores válidos según documentación HKA
  // Si faltan, usar valores por defecto para evitar errores de NullReference en HKA
  
  // Obtener ubicación válida usando catálogo para receptor
  const ubicacionReceptor = getUbicacionOrDefault(clienteData.locationCode);
  
  const receptorNormalizado = sanitizeReceptorData(invoice, clienteData, ubicacionReceptor);

  const receptor: ReceptorData = receptorNormalizado;
  
  // ============================================
  // TRANSFORMAR ITEMS DE FACTURA
  // ============================================
  const items: ItemFactura[] = invoice.items.map((item, index) => {
    if (!item.description || item.description.trim() === '') {
      throw new Error(`Item en línea ${index + 1} no tiene descripción. Todos los items deben tener descripción.`);
    }

    const normalized = normalizeInvoiceItem({
      DESCRIPCION: item.description,
      CODIGO: item.code,
      UNIDADMEDIDA: item.unit,
      CANTIDAD: item.quantity?.toString(),
      PRECIO_UNITARIO: item.unitPrice?.toString(),
      PRECIO_UNITARIO_DESCUENTO: item.discountedPrice?.toString() ?? item.unitPrice?.toString(),
      PRECIO_ITEM: item.subtotal?.toString() ?? item.total?.toString(),
      PRECIOACARREO: item.metadata?.acarreo,
      PRECIOSEGURO: item.metadata?.seguro,
      TASA_ITBMS: item.taxRate?.toString(),
    });

    const cantidad = Number.parseFloat(normalized.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new Error(`Item "${item.description}" tiene cantidad inválida: ${normalized.cantidad}`);
    }

    const precioUnitario = Number.parseFloat(normalized.precioUnitario);
    if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
      throw new Error(`Item "${item.description}" tiene precio unitario inválido: ${normalized.precioUnitario}`);
    }

    const precioItem = Number.parseFloat(normalized.precioItem);
    const tasaITBMSNumber = Number.parseFloat(normalized.tasaItbms);
    const valorITBMS = Number.isFinite(item.taxAmount)
      ? Number(item.taxAmount)
      : Number.parseFloat(normalizePrecioItem(precioItem * (tasaITBMSNumber / 100)));

    const tasaITBMS = mapTasaITBMS(tasaITBMSNumber);
    const valorITBMSFinal = tasaITBMS === TasaITBMS.EXENTO ? 0 : valorITBMS;

    return {
      secuencia: item.lineNumber || (index + 1),
      descripcion: normalized.descripcion,
      codigo: normalized.codigo || `PROD-${index + 1}`,
      codigoCPBS: item.cpbsCode || undefined,
      unidadMedida: normalized.unidadMedida || 'UND',
      cantidad,
      precioUnitario,
      precioUnitarioDescuento: Number.parseFloat(
        normalizePrecioUnitario(item.discountedPrice ?? precioUnitario),
      ),
      precioItem,
      valorTotal: precioItem + valorITBMSFinal,
      tasaITBMS,
      valorITBMS: valorITBMSFinal,
      tasaISC: 0,
      valorISC: 0,
      precioAcarreo: Number.parseFloat(normalizePrecioItem(item.metadata?.acarreo ?? 0)),
      precioSeguro: Number.parseFloat(normalizePrecioItem(item.metadata?.seguro ?? 0)),
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
  const ambienteTipo = (invoice.organization.hkaEnvironment || 'demo').toLowerCase() === 'prod'
    ? TipoAmbiente.PRODUCCION 
    : TipoAmbiente.DEMO;
  
  // ============================================
  // CONSTRUIR INPUT FINAL
  // ============================================
  // Normalizar número de documento: si no hay folio, usar un número sólo dígitos
  const numeroDocumentoSeguro = (() => {
    const raw = invoice.invoiceNumber;
    if (raw && /^\d+$/.test(raw)) return raw;
    const fallback = String(Date.now() % 1000000000).padStart(9, '0');
    return fallback;
  })();

  const facturaInput: FacturaElectronicaInput = {
    // Información General
    ambiente: ambienteTipo,
    tipoEmision: TipoEmision.NORMAL,
    tipoDocumento: mapTipoDocumento(invoice.documentType),
    numeroDocumento: numeroDocumentoSeguro,
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

function sanitizeReceptorData(
  invoice: InvoiceWithRelations,
  clienteData: Customer,
  ubicacionReceptor: ReturnType<typeof getUbicacionOrDefault>,
): ReceptorData {
  const rawRuc =
    clienteData.ruc ||
    invoice.receiverRuc ||
    '';

  const rawDv =
    clienteData.dv ||
    invoice.receiverDv ||
    '';

  const sanitized = normalizarRucReceptor(rawRuc, rawDv, invoice.receiverType);

  const tipoClienteBase = mapTipoCliente(clienteData.clientType || '01');
  const tipoCliente = sanitized.isConsumidorFinal
    ? TipoCliente.CONSUMIDOR_FINAL
    : tipoClienteBase;

  const razonSocialBase = clienteData.name || invoice.receiverName;
  const razonSocial = razonSocialBase && razonSocialBase.trim().length > 0
    ? razonSocialBase.trim()
    : sanitized.isConsumidorFinal
      ? 'CONSUMIDOR FINAL'
      : 'CLIENTE SIN NOMBRE';

  const direccionBase = clienteData.address || invoice.receiverAddress;
  const direccion = direccionBase && direccionBase.trim().length > 0
    ? direccionBase.trim()
    : 'PANAMA';

  return {
    tipoRuc: sanitized.tipoRuc,
    ruc: sanitized.ruc,
    dv: sanitized.dv,
    tipoCliente,
    razonSocial,
    direccion,
    codigoUbicacion: ubicacionReceptor.codigo,
    provincia: ubicacionReceptor.provincia,
    distrito: ubicacionReceptor.distrito,
    corregimiento: ubicacionReceptor.corregimiento,
    paisCodigo: clienteData.countryCode || 'PA',
    telefono: clienteData.phone || undefined,
    correo: clienteData.email || invoice.receiverEmail || undefined,
  };
}

function normalizarRucReceptor(
  rawRuc: string,
  rawDv: string,
  receiverType?: ReceiverType,
) {
  const cleanRuc = (rawRuc || '').replace(/[^0-9\-]/g, '');
  const cleanDv = (rawDv || '').replace(/\D/g, '');

  const esConsumidorFinal = receiverType === 'FINAL_CONSUMER';

  if (esConsumidorFinal || cleanRuc.length === 0 || cleanRuc.length < 8) {
    return {
      ruc: '0000000000',
      dv: '00',
      tipoRuc: TipoRUC.PERSONA_NATURAL,
      isConsumidorFinal: true,
    };
  }

  if (validarFormatoRUC(cleanRuc)) {
    const partes = cleanRuc.split('-');
    const base = partes.slice(0, 3).join('-');
    const dvCalculado = partes.length === 4
      ? partes[3]
      : calcularDigitoVerificador(base).padStart(2, '0');
    return {
      ruc: (partes[0] + partes[1]).padStart(8, '0'),
      dv: dvCalculado.padStart(2, '0'),
      tipoRuc: TipoRUC.PERSONA_JURIDICA,
      isConsumidorFinal: false,
    };
  }

  const numericRuc = cleanRuc.replace(/\D/g, '');
  if (numericRuc.length >= 8) {
    const dvFinal = cleanDv.length > 0 ? cleanDv.padStart(2, '0') : '00';
    return {
      ruc: numericRuc.slice(0, 15),
      dv: dvFinal,
      tipoRuc: TipoRUC.PERSONA_JURIDICA,
      isConsumidorFinal: false,
    };
  }

  return {
    ruc: '0000000000',
    dv: '00',
    tipoRuc: TipoRUC.PERSONA_NATURAL,
    isConsumidorFinal: true,
  };
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
// FUNCIÓN: OBTENER RUC VÁLIDO PARA DEMO
// ============================================

/**
 * Obtiene RUC válido para ambiente demo o producción
 */
function getValidDemoRUC(): { ruc: string; dv: string } {
  // RUC demo válido proporcionado por usuario: 155738031-2-2023
  // Según ruc-validator.ts, el DV correcto para 155738031 es '20' (caso especial)
  // Pero el usuario proporcionó el formato 155738031-2-2023, así que usamos '2' como está
  // Si hay problemas, cambiar a '20'
  return {
    ruc: '155738031',
    dv: '20', // DV correcto según ruc-validator.ts (obtenerDVCorrecto)
  };
}

/**
 * Obtiene RUC válido según ambiente (demo o producción)
 */
function getValidRUC(
  rucOrg: string | null | undefined,
  dvOrg: string | null | undefined,
  isDemo: boolean
): { ruc: string; dv: string } {
  // Si es demo, usar RUC demo válido
  if (isDemo) {
    return getValidDemoRUC();
  }
  
  // En producción, usar RUC de la organización
  if (rucOrg && dvOrg) {
    const rucTrimmed = rucOrg.trim();
    const dvTrimmed = dvOrg.trim();

    const numericRuc = rucTrimmed.replace(/\D/g, '');
    const numericDv = dvTrimmed.replace(/\D/g, '');

    const dvResolved = (() => {
      if (numericDv.length === 0) {
        hkaLogger.warn('DV_SANITIZED_DEFAULT', 'DV del emisor no era numérico. Se usará "01" como valor por defecto.', {
          original: dvTrimmed,
        });
        return '01';
      }
      if (numericDv.length <= 2) return numericDv.padStart(1, '0');
      return numericDv.slice(0, 2);
    })();

    if (/^\d{8,15}$/.test(rucTrimmed)) {
      return {
        ruc: rucTrimmed,
        dv: dvResolved,
      };
    }

    if (numericRuc.length >= 8 && numericRuc.length <= 15) {
      hkaLogger.warn('RUC_SANITIZED', 'El RUC del emisor contenía caracteres no numéricos. Se aplicó sanitización automáticamente.', {
        original: rucTrimmed,
        sanitized: numericRuc,
      });

      return {
        ruc: numericRuc,
        dv: dvResolved,
      };
    }
  }
  
  // Fallback: usar RUC demo si no hay RUC de organización
  // (esto puede pasar en casos de prueba incluso en producción)
  hkaLogger.warn('RUC_FALLBACK', 'No se encontró RUC de organización, usando RUC demo como fallback', {
    data: { rucOrg, dvOrg, isDemo },
  });
  return getValidDemoRUC();
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

