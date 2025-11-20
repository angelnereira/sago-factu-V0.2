/**
 * Date Utilities for HKA Integration
 */

/**
 * Formatea fecha a formato HKA: YYYY-MM-DD
 */
export function formatDateHKA(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formatea fecha y hora a formato HKA: YYYY-MM-DDTHH:mm:ss
 */
export function formatDateTimeHKA(date: Date): string {
    const datePart = formatDateHKA(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${datePart}T${hours}:${minutes}:${seconds}`;
}

/**
 * Parsea fecha desde formato HKA a Date
 */
export function parseDateHKA(dateStr: string): Date {
    return new Date(dateStr);
}

/**
 * Parsea fecha y hora desde formato HKA a Date
 * Alias para parseDateHKA ya que el constructor de Date maneja ISO strings
 */
export function parseHkaDateTime(dateTimeStr: string): Date {
    return new Date(dateTimeStr);
}

/**
 * Convierte Date a formato HKA fecha y hora (ISO 8601 completo)
 * Alias para formatDateTimeHKA
 */
export function toHkaDateTime(date: Date): string {
    return formatDateTimeHKA(date);
}

/**
 * Convierte Date a formato HKA fecha solamente (YYYY-MM-DD)
 * Alias para formatDateHKA
 */
export function toHkaDate(date: Date): string {
    return formatDateHKA(date);
}
