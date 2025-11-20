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
