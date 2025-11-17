/**
 * 🔒 ENCRIPTACIÓN SEGURA DE TOKENS HKA
 *
 * Algoritmo: AES-256-GCM + PBKDF2 (derivación de clave)
 * - GCM mode proporciona autenticación + confidencialidad
 * - PBKDF2 con 120,000 iteraciones (resistente a fuerza bruta)
 * - Salt aleatorio para cada encriptación
 *
 * ⚠️ CRÍTICO: ENCRYPTION_KEY NUNCA debe ser hardcodeado
 */

import crypto from 'crypto';
import { z } from 'zod';

// ============================================================================
// VALIDACIÓN Y CONFIGURACIÓN
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const PBKDF2_ITERATIONS = 120000; // Resistente a fuerza bruta
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits (recomendado para GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits

// ============================================================================
// FUNCIÓN AUXILIAR: Obtener y Validar ENCRYPTION_KEY
// ============================================================================
// IMPORTANTE: Se lee dinámicamente (no en module load time) para asegurar que
// las variables de entorno estén disponibles en Next.js API routes
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    const errorMsg =
      '🔴 ERROR CRÍTICO: ENCRYPTION_KEY no está configurada\n\n' +
      'Esta variable es obligatoria para cifrar credenciales HKA.\n\n' +
      'Generar clave con: openssl rand -hex 32\n' +
      'Luego configurar en .env: ENCRYPTION_KEY=<valor generado>\n';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (key.length < 32) {
    throw new Error(`ENCRYPTION_KEY debe tener mínimo 32 caracteres (tiene ${key.length})`);
  }

  return key;
}

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface EncryptedData {
  salt: string; // hex
  iv: string; // hex
  encrypted: string; // hex
  authTag: string; // hex
}

// ============================================================================
// FUNCIONES PÚBLICAS
// ============================================================================

/**
 * Encripta un token HKA con AES-256-GCM + PBKDF2
 *
 * @param token Token a encriptar
 * @returns Token encriptado en formato JSON-hex
 */
export function encryptToken(token: string): string {
  try {
    // Obtener ENCRYPTION_KEY dinámicamente
    const encryptionKey = getEncryptionKey();
    console.log('[encryptToken] Starting encryption, ENCRYPTION_KEY available');

    // 1. Generar salt aleatorio
    const salt = crypto.randomBytes(SALT_LENGTH);

    // 2. Derivar clave con PBKDF2 (resistente a diccionario)
    const derivedKey = crypto.pbkdf2Sync(
      encryptionKey,
      salt,
      PBKDF2_ITERATIONS,
      32, // 256 bits
      'sha256'
    );

    // 3. Generar IV aleatorio
    const iv = crypto.randomBytes(IV_LENGTH);

    // 4. Encriptar con GCM (confidencialidad + autenticación)
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    let encrypted = cipher.update(token, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    // 5. Obtener tag de autenticación (previene tampering)
    const authTag = cipher.getAuthTag();

    // 6. Serializar en JSON
    const encryptedData: EncryptedData = {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    };

    return JSON.stringify(encryptedData);
  } catch (error) {
    console.error('[Encryption] Error encriptando token', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Fallo al encriptar token HKA');
  }
}

/**
 * Desencripta un token HKA
 *
 * @param encryptedJson Token encriptado (salida de encryptToken)
 * @returns Token desencriptado
 */
export function decryptToken(encryptedJson: string): string {
  try {
    // Obtener ENCRYPTION_KEY dinámicamente
    const encryptionKey = getEncryptionKey();

    // 1. Parsear JSON
    const encryptedData: EncryptedData = JSON.parse(encryptedJson);

    // 2. Convertir hex a Buffer
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    // 3. Derivar clave con PBKDF2 (mismo salt)
    const derivedKey = crypto.pbkdf2Sync(
      encryptionKey,
      salt,
      PBKDF2_ITERATIONS,
      32,
      'sha256'
    );

    // 4. Desencriptar con GCM
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag); // Verificar autenticación

    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Error desencriptando token', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Fallo al desencriptar token HKA (posible datos corruptos o clave incorrecta)');
  }
}

/**
 * Valida que un token puede ser desencriptado
 *
 * @param encryptedJson Token para validar
 * @returns true si es válido, false si no
 */
export function isValidEncryptedToken(encryptedJson: string): boolean {
  try {
    decryptToken(encryptedJson);
    return true;
  } catch {
    return false;
  }
}

