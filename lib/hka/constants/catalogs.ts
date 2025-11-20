/**
 * Catálogos HKA - Códigos oficiales para Facturación Electrónica Panamá
 */

export const TIPO_DOCUMENTO = {
  FACTURA: '01',
  NOTA_CREDITO: '02',
  NOTA_DEBITO: '03',
  FACTURA_EXPORTACION: '04',
} as const;

export const TIPO_EMISION = {
  EMISION_NORMAL: '01',
  CONTINGENCIA: '02',
} as const;

export const TIPO_CLIENTE = {
  CONTRIBUYENTE: '01',
  CONSUMIDOR_FINAL: '02',
  GOBIERNO: '03',
  EXTRANJERO: '04',
} as const;

export const NATURALEZA_OPERACION = {
  VENTA: '01',
  EXPORTACION: '02',
  OPERACIONES_FINANCIERAS: '10',
  NOTA_CREDITO: '11',
  NOTA_DEBITO: '12',
} as const;

export const TIPO_RUC = {
  PERSONA_NATURAL: '1',
  PERSONA_JURIDICA: '2',
  EXTRANJERO: '3',
} as const;

export const FORMA_PAGO = {
  EFECTIVO: '01',
  CHEQUE: '02',
  TARJETA_CREDITO: '03',
  TARJETA_DEBITO: '04',
  TRANSFERENCIA: '05',
  OTRO: '99',
} as const;

export const PLAZO_PAGO = {
  CONTADO: '0', // Inmediato
  CREDITO_30: '30',
  CREDITO_60: '60',
  CREDITO_90: '90',
  CREDITO_120: '120',
} as const;

export const TIPO_ITEM = {
  BIEN: '1',
  SERVICIO: '2',
} as const;

export const CODIGO_ITBMS = {
  ITBMS_7: '01', // 7%
  ITBMS_10: '02', // 10%
  ITBMS_15: '03', // 15%
  EXENTO: '00',
} as const;

/**
 * Códigos de respuesta HKA
 * 200 = Éxito
 * 100 = Procesando (aún no hay respuesta de DGI)
 * 4XX = Errores de negocio
 */
export const HKA_RESPONSE_CODES = {
  SUCCESS: '200',
  PROCESSING: '100',
  INVALID_CREDENTIALS: '401',
  VALIDATION_ERROR: '400',
  INSUFFICIENT_FOLIOS: '402',
  DUPLICATE_DOCUMENT: '409',
  SYSTEM_ERROR: '500',
} as const;

export type TipoDocumento = typeof TIPO_DOCUMENTO[keyof typeof TIPO_DOCUMENTO];
export type TipoEmision = typeof TIPO_EMISION[keyof typeof TIPO_EMISION];
export type TipoCliente = typeof TIPO_CLIENTE[keyof typeof TIPO_CLIENTE];
export type NaturalezaOperacion = typeof NATURALEZA_OPERACION[keyof typeof NATURALEZA_OPERACION];
export type TipoRuc = typeof TIPO_RUC[keyof typeof TIPO_RUC];
export type FormaPago = typeof FORMA_PAGO[keyof typeof FORMA_PAGO];
export type PlazoPago = typeof PLAZO_PAGO[keyof typeof PLAZO_PAGO];
export type CodigoItbms = typeof CODIGO_ITBMS[keyof typeof CODIGO_ITBMS];
