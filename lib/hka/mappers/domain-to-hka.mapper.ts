/**
 * Domain to HKA Mapper
 * Convierte modelos de dominio (Prisma) a formatos HKA
 */

import type {
  EnviarFacturaRequest,
  HkaEmisor,
  HkaReceptor,
  HkaItem,
  HkaDescuento,
  HkaTotalesSubTotales,
  HkaUbicacion,
  AnulacionDocumentoRequest,
  EnvioCorreoRequest,
} from '../types';
import { toHkaDateTime, toHkaDate } from '../utils/date.utils';
import { formatMonto, formatCantidad, formatRuc } from '../utils/encoding.utils';
import { TIPO_RUC, TIPO_DOCUMENTO, NATURALEZA_OPERACION } from '../constants/catalogs';

/**
 * Tipos de entrada esperados (basados en Prisma models)
 */
interface InvoiceInput {
  id: string;
  invoiceNumber: string;
  emissionDate: Date;
  dueDate: Date | null;
  currency: string;
  exchangeRate?: number | null;
  notes?: string | null;
  operationType: string;
  paymentMethod: string;
  paymentTerm: string;

  // Relaciones
  organization: OrganizationInput;
  customer: CustomerInput;
  items: InvoiceItemInput[];

  // Cálculos
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  total: number;
}

interface OrganizationInput {
  id: string;
  ruc: string;
  dv: string;
  name: string;
  commercialName?: string | null;
  address: string;
  province: string;
  district: string;
  corregimiento: string;
  phone?: string | null;
  email: string;
}

interface CustomerInput {
  id: string;
  ruc: string;
  dv: string;
  name: string;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  corregimiento?: string | null;
  phone?: string | null;
  email?: string | null;
  customerType: string;
}

interface InvoiceItemInput {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  productCode?: string | null;
  unit?: string | null;
}

/**
 * Mapper principal
 */
export class DomainToHkaMapper {
  /**
   * Convierte Invoice completa a EnviarFacturaRequest
   */
  static toEnviarFacturaRequest(invoice: InvoiceInput): EnviarFacturaRequest {
    return {
      tipoEmision: '01', // Uso normal
      tipoDocumento: this.mapTipoDocumento(invoice.operationType),
      numeroDocumentoFiscal: invoice.invoiceNumber,
      puntoFacturacionFiscal: '001', // Default, ajustar según config
      naturalezaOperacion: this.mapNaturalezaOperacion(invoice.operationType),
      tipoOperacion: '1', // Venta
      destinoOperacion: '1', // Panamá
      formatoCAFE: '1', // Formato nuevo
      entregaCAFE: '1', // Entregar
      envioContenedor: '2', // No aplica
      procesoGeneracion: '1', // Aplicación propia
      tipoVenta: '1', // Bienes o servicios
      informacionInteres: invoice.notes || '',

      fechaEmision: toHkaDateTime(invoice.emissionDate),

      emisor: this.mapEmisor(invoice.organization),
      receptor: this.mapReceptor(invoice.customer),
      listaItems: {
        item: invoice.items.map(item => this.mapItem(item)),
      },

      totalesSubTotales: this.mapTotales(invoice),

      // Opcional: OTD (Otras Transacciones Digitales) si aplica
      ...(invoice.paymentTerm === 'CREDIT' && invoice.dueDate ? {
        fechaVencimiento: toHkaDate(invoice.dueDate),
      } : {}),
    };
  }

  /**
   * Mapea Organization a HkaEmisor
   */
  private static mapEmisor(org: OrganizationInput): HkaEmisor {
    const rucFormateado = formatRuc(org.ruc, '2'); // Jurídica por defecto

    return {
      rucEmisor: rucFormateado,
      digitoVerificadorEmisor: org.dv,
      razonSocialEmisor: org.name,
      nombreComercialEmisor: org.commercialName || org.name,
      direccionEmisor: org.address,
      codigoUbicacionEmisor: this.buildCodigoUbicacion(org.province, org.district, org.corregimiento),
      ubicacion: {
        provincia: org.province,
        distrito: org.district,
        corregimiento: org.corregimiento,
      },
      ...(org.phone ? { telefonoEmisor: [org.phone] } : {}),
      correoEmisor: [org.email],
    };
  }

  /**
   * Mapea Customer a HkaReceptor
   */
  private static mapReceptor(customer: CustomerInput): HkaReceptor {
    const tipoRuc = this.mapTipoRuc(customer.customerType);
    const rucFormateado = formatRuc(customer.ruc, tipoRuc);

    return {
      tipoReceptor: tipoRuc,
      tipoContribuyente: this.mapTipoContribuyente(customer.customerType),
      numeroRUCReceptor: rucFormateado,
      digitoVerificadorReceptor: customer.dv,
      razonSocialReceptor: customer.name,
      direccionReceptor: customer.address || 'N/A',
      codigoUbicacionReceptor: customer.province
        ? this.buildCodigoUbicacion(customer.province, customer.district, customer.corregimiento)
        : '1-1-1', // Default
      ...(customer.province ? {
        ubicacion: {
          provincia: customer.province,
          distrito: customer.district || '',
          corregimiento: customer.corregimiento || '',
        },
      } : {}),
      ...(customer.email ? { correoReceptor: [customer.email] } : {}),
      ...(customer.phone ? { telefonoReceptor: [customer.phone] } : {}),
    };
  }

  /**
   * Mapea InvoiceItem a HkaItem
   */
  private static mapItem(item: InvoiceItemInput): HkaItem {
    const cantidad = formatCantidad(item.quantity, 2);
    const precioUnitario = formatMonto(item.unitPrice, 2);
    const precioUnitarioDescuento = formatMonto(item.unitPrice - (item.discount / item.quantity), 2);
    const valorTotal = formatMonto(item.total, 2);

    return {
      descripcion: item.description,
      cantidad,
      unidadMedida: item.unit || 'UND',
      precioUnitario,
      precioUnitarioDescuento,
      precioItem: precioUnitario,
      valorTotal,

      // Descuentos
      ...(item.discount > 0 ? {
        listaDescBonificacion: {
          descuentoBonificacion: [{
            descripcionDescBonificacion: 'Descuento',
            montoDescBonificacion: formatMonto(item.discount, 2),
            porcentajeDescBonificacion: formatMonto((item.discount / item.subtotal) * 100, 2),
          }],
        },
      } : {}),

      // Tasación (impuestos)
      listaTasaImpuesto: {
        tasaimpuesto: [{
          codigoTasaImpuesto: this.mapCodigoImpuesto(item.taxRate),
          tasaImpuesto: formatMonto(item.taxRate, 2),
          valorTasaImpuesto: formatMonto(item.taxAmount, 2),
        }],
      },

      // Código de producto si existe
      ...(item.productCode ? {
        codigoGTIN: item.productCode,
      } : {}),
    };
  }

  /**
   * Mapea totales de factura
   */
  private static mapTotales(invoice: InvoiceInput): HkaTotalesSubTotales {
    const totalGravado = formatMonto(invoice.subtotal, 2);
    const totalDescuento = formatMonto(invoice.totalDiscount, 2);
    const totalITBMS = formatMonto(invoice.totalTax, 2);
    const totalFactura = formatMonto(invoice.total, 2);

    return {
      totalGravado,
      totalDescuento,
      totalITBMS,
      totalFactura,
      totalNetoAPagar: totalFactura,

      // Totales opcionales según caso
      totalExento: '0.00',
      totalExonerado: '0.00',
      totalNoGravado: '0.00',
      totalPrecioNeto: totalGravado,
      totalTodosItems: totalFactura,
      totalAntesDescuento: formatMonto(invoice.subtotal + invoice.totalDiscount, 2),

      // Moneda
      tipoMoneda: invoice.currency === 'USD' ? 'USD' : 'PAB',
      ...(invoice.exchangeRate && invoice.currency !== 'USD' ? {
        tipoCambioMoneda: formatMonto(invoice.exchangeRate, 4),
      } : {}),

      // Valor en letras
      valorTotalEnLetras: this.numberToWords(invoice.total),

      // Forma de pago
      formaPago: [{
        formaPagoFac: this.mapFormaPago(invoice.paymentMethod),
        descFormaPago: this.mapDescripcionPago(invoice.paymentMethod),
        valorCuotaPagada: totalFactura,
      }],
    };
  }

  /**
   * Convierte Invoice a AnulacionDocumentoRequest
   */
  static toAnulacionRequest(
    invoice: InvoiceInput,
    motivo: string
  ): AnulacionDocumentoRequest {
    return {
      codigoGeneracion: invoice.id, // Usar el CUFE/protocoloSeguridad retornado por HKA
      motivoAnulacion: motivo,
    };
  }

  /**
   * Convierte Invoice a EnvioCorreoRequest
   */
  static toEnvioCorreoRequest(
    codigoGeneracion: string,
    emails: string | string[]
  ): EnvioCorreoRequest {
    return {
      codigoGeneracion,
      correos: Array.isArray(emails) ? emails.join(',') : emails,
    };
  }

  // ==================== Helpers de Mapeo ====================

  private static mapTipoDocumento(operationType: string): string {
    const map: Record<string, string> = {
      'SALE': TIPO_DOCUMENTO.FACTURA,
      'SERVICE': TIPO_DOCUMENTO.FACTURA,
      'CREDIT_NOTE': TIPO_DOCUMENTO.NOTA_CREDITO,
      'DEBIT_NOTE': TIPO_DOCUMENTO.NOTA_DEBITO,
    };
    return map[operationType] || TIPO_DOCUMENTO.FACTURA;
  }

  private static mapNaturalezaOperacion(operationType: string): string {
    const map: Record<string, string> = {
      'SALE': NATURALEZA_OPERACION.VENTA_BIENES_SERVICIOS,
      'SERVICE': NATURALEZA_OPERACION.VENTA_BIENES_SERVICIOS,
      'EXPORT': NATURALEZA_OPERACION.EXPORTACION,
    };
    return map[operationType] || NATURALEZA_OPERACION.VENTA_BIENES_SERVICIOS;
  }

  private static mapTipoRuc(customerType: string): '1' | '2' | '3' {
    const map: Record<string, '1' | '2' | '3'> = {
      'NATURAL': TIPO_RUC.NATURAL,
      'JURIDICA': TIPO_RUC.JURIDICA,
      'EXTRANJERO': TIPO_RUC.EXTRANJERO,
    };
    return map[customerType] || TIPO_RUC.JURIDICA;
  }

  private static mapTipoContribuyente(customerType: string): '1' | '2' {
    return customerType === 'JURIDICA' ? '1' : '2';
  }

  private static mapCodigoImpuesto(taxRate: number): string {
    if (taxRate === 0) return '00'; // Exento
    if (taxRate === 7) return '01'; // ITBMS 7%
    if (taxRate === 10) return '02'; // ITBMS 10%
    if (taxRate === 15) return '03'; // ITBMS 15%
    return '01'; // Default 7%
  }

  private static mapFormaPago(paymentMethod: string): string {
    const map: Record<string, string> = {
      'CASH': '01', // Efectivo
      'TRANSFER': '02', // Transferencia
      'CHECK': '03', // Cheque
      'CARD': '04', // Tarjeta
      'CREDIT': '99', // Crédito
    };
    return map[paymentMethod] || '01';
  }

  private static mapDescripcionPago(paymentMethod: string): string {
    const map: Record<string, string> = {
      'CASH': 'Efectivo',
      'TRANSFER': 'Transferencia Bancaria',
      'CHECK': 'Cheque',
      'CARD': 'Tarjeta de Crédito/Débito',
      'CREDIT': 'Crédito',
    };
    return map[paymentMethod] || 'Efectivo';
  }

  /**
   * Construye código de ubicación X-X-X
   */
  private static buildCodigoUbicacion(
    provincia?: string | null,
    distrito?: string | null,
    corregimiento?: string | null
  ): string {
    // Mapeo simple - en producción, usar tabla de códigos oficiales
    const prov = provincia ? this.getCodigoProvincia(provincia) : '1';
    const dist = distrito ? '1' : '1';
    const corr = corregimiento ? '1' : '1';

    return `${prov}-${dist}-${corr}`;
  }

  private static getCodigoProvincia(provincia: string): string {
    const map: Record<string, string> = {
      'Panamá': '8',
      'Colón': '3',
      'Chiriquí': '4',
      'Bocas del Toro': '1',
      'Coclé': '2',
      'Herrera': '6',
      'Los Santos': '7',
      'Veraguas': '9',
      'Darién': '5',
      'Panamá Oeste': '10',
      'Guna Yala': '11',
      'Emberá-Wounaan': '12',
      'Ngäbe-Buglé': '13',
    };
    return map[provincia] || '8'; // Default Panamá
  }

  /**
   * Convierte número a palabras (simplificado)
   * En producción, usar librería como numero-a-letras
   */
  private static numberToWords(num: number): string {
    if (num === 0) return 'CERO BALBOAS CON 00/100';

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    // Simplificado - en producción usar librería completa
    return `${intPart.toFixed(0)} BALBOAS CON ${decPart.toString().padStart(2, '0')}/100`;
  }

  /**
   * Valida que los datos mínimos existan antes de mapear
   */
  static validateInvoiceForEmission(invoice: InvoiceInput): void {
    if (!invoice.organization.ruc || !invoice.organization.dv) {
      throw new Error('Organization RUC and DV are required');
    }

    if (!invoice.customer.ruc || !invoice.customer.dv) {
      throw new Error('Customer RUC and DV are required');
    }

    if (!invoice.items.length) {
      throw new Error('Invoice must have at least one item');
    }

    if (invoice.total <= 0) {
      throw new Error('Invoice total must be greater than 0');
    }

    if (!invoice.invoiceNumber) {
      throw new Error('Invoice number is required');
    }
  }
}
