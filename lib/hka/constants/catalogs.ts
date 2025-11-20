/**
 * HKA Catalogs and Constants
 * Catálogos oficiales de HKA para facturación electrónica en Panamá
 */

/**
 * Tipos de RUC
 */
export const TIPO_RUC = {
    NATURAL: '01',
    JURIDICO: '02',
    EXTRANJERO: '03',
} as const;

/**
 * Tipos de Documento
 */
export const TIPO_DOCUMENTO = {
    FACTURA: '01',
    FACTURA_EXPORTACION: '02',
    NOTA_CREDITO: '03',
    NOTA_DEBITO: '04',
    NOTA_CREDITO_GENERICA: '05',
    NOTA_DEBITO_GENERICA: '06',
    FACTURA_ZONA_FRANCA: '07',
} as const;

/**
 * Naturaleza de la Operación
 */
export const NATURALEZA_OPERACION = {
    VENTA: '01',
    DEVOLUCION: '02',
    BONIFICACION: '03',
    TRASLADO: '04',
    CONSIGNACION: '05',
    OTRO: '99',
} as const;

/**
 * Códigos de Respuesta HKA
 */
export const HKA_RESPONSE_CODES = {
    SUCCESS: '00',
    ERROR_AUTENTICACION: '01',
    ERROR_VALIDACION: '02',
    ERROR_SISTEMA: '03',
    DOCUMENTO_DUPLICADO: '04',
    FOLIOS_INSUFICIENTES: '05',
} as const;

/**
 * Estados de Documento
 */
export const ESTADO_DOCUMENTO = {
    RECIBIDO: '01',
    PROCESANDO: '02',
    APROBADO: '03',
    RECHAZADO: '04',
    ANULADO: '05',
} as const;

/**
 * Tipos de Identificación
 */
export const TIPO_IDENTIFICACION = {
    RUC: '01',
    CEDULA: '02',
    PASAPORTE: '03',
    OTRO: '04',
} as const;
