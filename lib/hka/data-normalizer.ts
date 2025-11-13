/**
 * Utilidades para normalizar datos de facturas antes de enviarlas a HKA.
 * Se encarga de:
 *  - Manejar valores nulos o strings vacíos.
 *  - Formatear valores numéricos con la precisión decimal esperada por HKA.
 *  - Proveer helpers para normalizar ítems y datos del receptor.
 */

export const DECIMAL_PRECISION = {
  CANTIDAD: 4,
  PRECIO_UNITARIO: 6,
  PRECIO_ITEM: 2,
  PRECIO_TOTAL: 2,
  PRECIO_TOTAL_FACTURA: 2,
  TOTAL_GRAVADO: 2,
  TOTAL_DESCUENTO: 2,
  TOTAL_ITBMS: 2,
  TOTAL_RECIBIDO: 2,
  TASA_ITBMS: 2,
  TASA_DESCUENTO: 2,
  DEFAULT: 2,
} as const;

const ZERO_BY_PRECISION: Record<number, string> = {};

function zeroByPrecision(precision: number): string {
  if (!(precision in ZERO_BY_PRECISION)) {
    ZERO_BY_PRECISION[precision] = `0.${'0'.repeat(precision)}`;
  }
  return ZERO_BY_PRECISION[precision];
}

function toNumber(value: string | number): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = value.trim().replace(/,/g, '');
  if (!cleaned) return null;

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeDecimal(
  value: string | number | null | undefined,
  precision: number = DECIMAL_PRECISION.DEFAULT,
  allowNull = false,
): string | null {
  if (value === null || value === undefined || value === '') {
    return allowNull ? null : zeroByPrecision(precision);
  }

  const num = toNumber(value);
  if (num === null) {
    return allowNull ? null : zeroByPrecision(precision);
  }

  return num.toFixed(precision);
}

export function normalizeCantidad(
  value: string | number | null | undefined,
  minimum = '1.0000',
): string {
  const normalized = normalizeDecimal(value, DECIMAL_PRECISION.CANTIDAD, false)!;
  return normalized === zeroByPrecision(DECIMAL_PRECISION.CANTIDAD) ? minimum : normalized;
}

export function normalizePrecioUnitario(value: string | number | null | undefined): string {
  return normalizeDecimal(value, DECIMAL_PRECISION.PRECIO_UNITARIO, false)!;
}

export function normalizePrecioItem(value: string | number | null | undefined): string {
  return normalizeDecimal(value, DECIMAL_PRECISION.PRECIO_ITEM, false)!;
}

export function normalizePrecioTotal(value: string | number | null | undefined): string {
  return normalizeDecimal(value, DECIMAL_PRECISION.PRECIO_TOTAL, false)!;
}

export function normalizeTasa(value: string | number | null | undefined): string {
  return normalizeDecimal(value, DECIMAL_PRECISION.TASA_ITBMS, false)!;
}

const EMPTY_VALUES = new Set(['', 'nan', 'null', 'undefined']);

export function normalizeString(
  value: string | number | null | undefined,
  allowNull = true,
): string | null {
  if (value === null || value === undefined) {
    return allowNull ? null : '';
  }

  const strValue = String(value).trim();
  if (EMPTY_VALUES.has(strValue.toLowerCase())) {
    return allowNull ? null : '';
  }

  return strValue;
}

export function normalizeBoolean(
  value: string | number | boolean | null | undefined,
  defaultValue = false,
): boolean {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'si', 'sí', 'yes', 'y', 's'].includes(normalized);
}

export function normalizeInteger(
  value: string | number | null | undefined,
  allowNull = false,
): number | null {
  if (value === null || value === undefined || value === '') {
    return allowNull ? null : 0;
  }

  const strValue = typeof value === 'string' ? value.trim() : value.toString();
  if (!strValue) return allowNull ? null : 0;

  const parsed = Number.parseInt(strValue, 10);
  if (!Number.isFinite(parsed)) {
    return allowNull ? null : 0;
  }

  return parsed;
}

export interface RawInvoiceItem {
  DESCRIPCION?: string | null;
  CODIGO?: string | null;
  UNIDADMEDIDA?: string | number | null;
  CANTIDAD?: string | number | null;
  PRECIO_UNITARIO?: string | number | null;
  PRECIO_UNITARIO_DESCUENTO?: string | number | null;
  PRECIO_ITEM?: string | number | null;
  PRECIOACARREO?: string | number | null;
  PRECIOSEGURO?: string | number | null;
  TASA_ITBMS?: string | number | null;
}

export interface NormalizedInvoiceItem {
  descripcion: string;
  codigo: string | null;
  unidadMedida: string | null;
  cantidad: string;
  precioUnitario: string;
  precioUnitarioDescuento: string;
  precioItem: string;
  precioAcarreo: string;
  precioSeguro: string;
  tasaItbms: string;
}

export function normalizeInvoiceItem(raw: RawInvoiceItem): NormalizedInvoiceItem {
  return {
    descripcion: normalizeString(raw.DESCRIPCION, false) || 'SERVICIO',
    codigo: normalizeString(raw.CODIGO, true),
    unidadMedida: normalizeString(raw.UNIDADMEDIDA, true),
    cantidad: normalizeCantidad(raw.CANTIDAD),
    precioUnitario: normalizePrecioUnitario(raw.PRECIO_UNITARIO),
    precioUnitarioDescuento: normalizePrecioUnitario(raw.PRECIO_UNITARIO_DESCUENTO),
    precioItem: normalizePrecioItem(raw.PRECIO_ITEM),
    precioAcarreo: normalizePrecioItem(raw.PRECIOACARREO),
    precioSeguro: normalizePrecioItem(raw.PRECIOSEGURO),
    tasaItbms: normalizeTasa(raw.TASA_ITBMS),
  };
}

export interface RawCustomerData {
  TIPO_CLIENTE_FE?: string | number | null;
  TIPO_CONTRIBUYENTE?: string | number | null;
  NUMERO_RUC?: string | number | null;
  DV?: string | number | null;
  RAZON_SOCIAL?: string | null;
  Direccion?: string | null;
  TELEFONO?: string | null;
  CODIGO_UBICACION?: string | null;
  PROVINCIA?: string | number | null;
  DISTRITO?: string | null;
  CORREGIMIENTO?: string | null;
  PAIS?: string | null;
  CORREO_ELECTRONICO?: string | null;
}

export interface NormalizedCustomerData {
  tipoClienteFE: number;
  tipoContribuyente: number | null;
  numeroRuc: string;
  dv: string | null;
  razonSocial: string;
  direccion: string | null;
  telefono: string | null;
  codigoUbicacion: string | null;
  provincia: number;
  distrito: string;
  corregimiento: string;
  pais: string;
  correoElectronico: string | null;
}

export function normalizeCustomerData(raw: RawCustomerData): NormalizedCustomerData {
  return {
    tipoClienteFE: normalizeInteger(raw.TIPO_CLIENTE_FE, false) || 2,
    tipoContribuyente: normalizeInteger(raw.TIPO_CONTRIBUYENTE, true),
    numeroRuc: normalizeString(raw.NUMERO_RUC, false) || '',
    dv: normalizeString(raw.DV, true),
    razonSocial: normalizeString(raw.RAZON_SOCIAL, false) || 'CLIENTE',
    direccion: normalizeString(raw.Direccion, true),
    telefono: normalizeString(raw.TELEFONO, true),
    codigoUbicacion: normalizeString(raw.CODIGO_UBICACION, true),
    provincia: normalizeInteger(raw.PROVINCIA, false) || 1,
    distrito: normalizeString(raw.DISTRITO, false) || 'N/A',
    corregimiento: normalizeString(raw.CORREGIMIENTO, false) || 'N/A',
    pais: normalizeString(raw.PAIS, false) || 'PA',
    correoElectronico: normalizeString(raw.CORREO_ELECTRONICO, true),
  };
}

export function validateDecimalFormat(value: string, expectedPrecision: number): boolean {
  const regex = new RegExp(`^\\d+\\.\\d{${expectedPrecision}}$`);
  return regex.test(value);
}

export const NORMALIZER_EXAMPLES = {
  cantidad: normalizeCantidad(1),
  cantidadDecimal: normalizeCantidad(1.5),
  precioUnitario: normalizePrecioUnitario(26.724547),
  precioItem: normalizePrecioItem(26.52),
  tasa: normalizeTasa(7),
  stringNull: normalizeString(null),
  stringValue: normalizeString(' Texto '),
};


