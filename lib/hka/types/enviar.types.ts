/**
 * HKA Enviar Types
 * Tipos para el método Enviar() - Emisión de facturas
 */

import { HkaBaseResponse } from './common.types';

export interface EnviarFacturaRequest {
  // Sucursal Emisor
  codigoSucursalEmisor: string; // N4 (ej: '0000')
  tipoSucursal: string; // '1' = Principal, '2' = Sucursal

  // Datos de Transacción
  datosTransaccion: DatosTransaccion;

  // Cliente
  cliente: ClienteFactura;

  // Items/Productos
  listaItems: {
    item: ItemFactura[];
  };

  // Totales
  totalesSubTotales: TotalesSubTotales;

  // Opcionales
  listaFormaPago?: {
    formaPago: FormaPago[];
  };
  listaDocsFiscalReferenciados?: {
    docFiscalReferenciado: DocFiscalReferenciado[];
  };
}

export interface DatosTransaccion {
  tipoEmision: string; // '01' = Normal, '02' = Contingencia
  tipoDocumento: string; // '01' = Factura, '02' = NC, '03' = ND
  numeroDocumentoFiscal: string; // N10 (ej: '0000000001')
  puntoFacturacionFiscal: string; // AN4 (ej: '001')

  // Fechas (ISO8601 con timezone -05:00)
  fechaEmision: string;
  fechaSalidaBienes?: string;

  // Naturaleza y Ubicación
  naturalezaOperacion: string; // '01' = Venta, '10' = Operación, etc.
  ubicacion: Ubicacion;

  // Secuencias y Códigos
  codigoUbicacionEmisor: string; // AN15 (ej: '1-1-1')
  tipoOperacion: string; // '1' = Venta, '2' = Exportación
  destinoOperacion?: string;
  formatoCAFE: string; // '1' = DGI
  entregaCAFE: string; // '1' = En línea
  envioContenedor?: string;
  procesoGeneracion: string; // '1' = Aplicación cliente
  tipoVenta?: string;
  informacionInteres?: string; // CDATA - notas adicionales

  // Control
  numeroOrdenCompra?: string;
  numeroPedido?: string;
  placaVehiculo?: string;
}

export interface Ubicacion {
  provincia: string; // AN30
  distrito: string; // AN30
  corregimiento: string; // AN30
}

export interface ClienteFactura {
  tipoClienteFE: string; // '01' = Contribuyente, '02' = Final, '03' = Gobierno, '04' = Extranjero
  tipoContribuyente?: string; // '1' = Natural, '2' = Jurídica, '3' = Extranjero
  numeroRUC?: string; // AN20 con guiones (ej: '2-737-2342')
  digitoVerificadorRUC?: string; // N2
  razonSocial: string; // AN100
  direccion: string; // AN100
  ubicacion: Ubicacion;
  codigoUbicacion?: string; // AN15
  pais?: string; // AN30
  paisOtro?: string;
  correoElectronico1?: string; // AN60
  correoElectronico2?: string;
  telefonoContacto1?: string; // AN30
  telefonoContacto2?: string;
}

export interface ItemFactura {
  descripcion: string; // AN500
  cantidad: string; // N..8/2 (ej: '10.00')
  precioUnitario: string; // N..8/2 (ej: '15.50')
  precioUnitarioDescuento: string; // N..8/2
  precioItem: string; // N..10/2
  valorTotal: string; // N..12/2

  // Códigos y Clasificación
  codigoGTIN?: string;
  codigoCPBS?: string;
  cantCPBS?: string;
  codigoProducto?: string;

  // Descuentos
  tasaDescuento?: string; // N..5/2 (ej: '10.00')

  // ITBMS
  codigoITBMS: string; // '01' = 7%, '02' = 10%, '03' = 15%, '00' = Exento
  tasaITBMS: string; // N..5/2 (ej: '7.00')
  valorITBMS: string; // N..12/2

  // Unidad
  unidadMedida?: string; // 'UND', 'KG', etc.
}

export interface TotalesSubTotales {
  totalPrecioNeto: string; // N..12/2
  totalITBMS: string; // N..12/2
  totalMontoGravado: string; // N..12/2
  totalDescuento: string; // N..12/2
  totalAcarreo?: string;
  valorSeguro?: string;
  totalFactura: string; // N..12/2
  totalValorRecibido?: string;
  vuelto?: string;
  tiempoPago?: string; // '0' = Contado, '30' = 30 días
  nroItems: string; // Cantidad de items
  totalTodosItems: string; // N..12/2
}

export interface FormaPago {
  formaPagoFact: string; // '01' = Efectivo, '02' = Cheque, etc.
  descFormaPago: string; // AN100
  valorCuotaPagada?: string;
}

export interface DocFiscalReferenciado {
  fechaEmisionRef?: string;
  numeroFactura?: string;
  numeroSerie?: string;
  numeroInterno?: string;
}

export interface EnviarFacturaResponse extends HkaBaseResponse {
  cufe?: string; // Código Único de Factura Electrónica
  qr?: string; // QR Code en Base64
  protocolo?: string; // Número de protocolo HKA
  fechaProtocolo?: string;
  numeroDocumentoFiscal?: string;
}
