/**
 * HKA Encoding Utilities
 * Formateo de strings, números y encoding
 */

/**
 * Sanitiza string para CDATA (elimina caracteres problemáticos)
 */
export function sanitizeForCDATA(text: string): string {
  if (!text) return '';

  return text
    .replace(/]]>/g, ']] >') // Escape CDATA closing
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters
    .trim();
}

/**
 * Convierte string a Base64
 */
export function toBase64(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

/**
 * Convierte Base64 a string
 */
export function fromBase64(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Convierte Base64 a Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}

/**
 * Formatea monto decimal para HKA
 * Formato: N..12/2 (ej: 1234.56)
 * IMPORTANTE: Siempre con punto decimal, nunca coma
 */
export function formatMonto(amount: number | string, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  return num.toFixed(decimals);
}

/**
 * Formatea cantidad para HKA
 * Formato: N..8/2 o N..8/4 según necesidad
 */
export function formatCantidad(quantity: number | string, decimals: number = 2): string {
  return formatMonto(quantity, decimals);
}

/**
 * Pad left con ceros
 * Ej: padLeft('123', 10) → '0000000123'
 */
export function padLeft(value: string | number, length: number): string {
  const str = String(value);
  return str.padStart(length, '0');
}

/**
 * Pad right con espacios
 */
export function padRight(value: string, length: number): string {
  return value.padEnd(length, ' ');
}

/**
 * Trunca string a longitud máxima
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}

/**
 * Limpia caracteres especiales de texto
 */
export function cleanText(text: string): string {
  if (!text) return '';

  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
    .replace(/\s+/g, ' ') // Multiple spaces
    .trim();
}

/**
 * Formatea RUC con guiones
 * Ej: '27372342' → '2-737-2342'
 */
export function formatRuc(ruc: string, type: '1' | '2' | '3' = '2'): string {
  // Remover guiones existentes
  const clean = ruc.replace(/-/g, '');

  if (type === '1') {
    // Natural: X-XXX-XXXX
    if (clean.length !== 8) return ruc;
    return `${clean[0]}-${clean.substring(1, 4)}-${clean.substring(4)}`;
  } else if (type === '2') {
    // Jurídica: X-XXX-XXXX o XX-XXXX-XXXXXX
    if (clean.length === 8) {
      return `${clean[0]}-${clean.substring(1, 4)}-${clean.substring(4)}`;
    } else if (clean.length === 12) {
      return `${clean.substring(0, 2)}-${clean.substring(2, 6)}-${clean.substring(6)}`;
    }
  }

  return ruc;
}

/**
 * Extrae solo dígitos de un string
 */
export function extractDigits(text: string): string {
  return text.replace(/\D/g, '');
}

/**
 * Calcula porcentaje
 */
export function calculatePercentage(part: number, total: number, decimals: number = 2): string {
  if (total === 0) return '0.00';
  return formatMonto((part / total) * 100, decimals);
}
