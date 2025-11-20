/**
 * Encoding Utilities for HKA Integration
 */

/**
 * Codifica string a Base64
 */
export function encodeBase64(str: string): string {
    if (typeof window !== 'undefined') {
        // Browser
        return btoa(str);
    } else {
        // Node.js
        return Buffer.from(str, 'utf-8').toString('base64');
    }
}

/**
 * Decodifica string desde Base64
 */
export function decodeBase64(str: string): string {
    if (typeof window !== 'undefined') {
        // Browser
        return atob(str);
    } else {
        // Node.js
        return Buffer.from(str, 'base64').toString('utf-8');
    }
}

/**
 * Alias para decodeBase64 (usado en algunos mappers)
 */
export const fromBase64 = decodeBase64;

/**
 * Convierte Base64 a Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
    return Buffer.from(base64, 'base64');
}

/**
 * Convierte Buffer a Base64
 */
export function bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
}

/**
 * Escapa caracteres especiales XML
 */
export function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Desescapa caracteres especiales XML
 */
export function unescapeXml(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}

/**
 * Formatea un monto numérico al formato requerido por HKA (2 decimales fijos por defecto)
 * @param amount - El monto a formatear
 * @param decimales - Número de decimales (default 2)
 * @returns String con el monto formateado (ej. "100.00")
 */
export function formatMonto(amount: number, decimales: number = 2): string {
    return amount.toFixed(decimales);
}

/**
 * Formatea una cantidad numérica con decimales específicos
 * @param cantidad - La cantidad a formatear
 * @param decimales - Número de decimales (default 2)
 * @returns String con la cantidad formateada
 */
export function formatCantidad(cantidad: number, decimales: number = 2): string {
    return cantidad.toFixed(decimales);
}

/**
 * Formatea el RUC según requerimientos de HKA
 * @param ruc - El RUC original
 * @param tipoRuc - Tipo de RUC (1, 2, 3)
 * @returns RUC formateado
 */
export function formatRuc(ruc: string, tipoRuc: string): string {
    // Eliminar espacios en blanco
    return ruc.trim();
}
