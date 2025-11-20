/**
 * 🔒 ENCRIPTACIÓN SEGURA DE CREDENCIALES
 *
 * Utiliza AES-256-CBC para encriptar datos sensibles como contraseñas de HKA.
 * La clave de encriptación debe estar en process.env.ENCRYPTION_KEY.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Usar una clave por defecto SOLO para desarrollo si no hay variable de entorno.
// En producción esto DEBE ser configurado.
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-dev-secret-key-32-chars!!';
const IV_LENGTH = 16; // Para AES, siempre es 16

export function encrypt(text: string): string {
    // Asegurar que la clave tenga 32 bytes
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!text) return '';

    // Manejar caso donde el texto no está encriptado (migración/legacy)
    if (!text.includes(':')) {
        return text;
    }

    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');

        // Asegurar que la clave tenga 32 bytes
        const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error('Error desencriptando:', error);
        // Si falla la desencriptación, devolver el texto original por si acaso no estaba encriptado
        return text;
    }
}
