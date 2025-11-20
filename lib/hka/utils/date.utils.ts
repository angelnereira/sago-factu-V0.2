/**
 * HKA Date Utilities
 * Manejo de fechas con timezone Panamá (UTC-5) fijo
 */

/**
 * Convierte Date a formato HKA ISO8601 con timezone -05:00
 * Formato: YYYY-MM-DDTHH:mm:ss-05:00
 * IMPORTANTE: Panamá no tiene horario de verano, siempre -05:00
 */
export function toHkaDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
}

/**
 * Convierte Date a formato solo fecha YYYY-MM-DD
 */
export function toHkaDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Valida que la fecha de emisión no sea futura ni muy antigua
 * HKA acepta facturas con fecha hasta 90 días en el pasado
 */
export function validateEmissionDate(date: Date): { valid: boolean; error?: string } {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  if (date > now) {
    return {
      valid: false,
      error: 'Emission date cannot be in the future',
    };
  }

  if (date < ninetyDaysAgo) {
    return {
      valid: false,
      error: 'Emission date cannot be more than 90 days in the past',
    };
  }

  return { valid: true };
}

/**
 * Convierte fecha a formato para nombres de archivo
 * Formato: YYYYMMDD_HHmmss
 */
export function toFilenameSafeDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Parsea fecha ISO8601 de HKA a Date
 */
export function parseHkaDateTime(isoString: string): Date {
  // Remover timezone info y crear Date
  const cleanDate = isoString.replace(/-05:00$/, '');
  return new Date(cleanDate);
}
