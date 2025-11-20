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
