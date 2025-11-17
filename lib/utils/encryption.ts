/**
 * 🔒 ENCRIPTACIÓN SEGURA DE CERTIFICADOS DIGITALES
 *
 * NOTA: Los tokens HKA se almacenan en PLAINTEXT
 * (La encriptación causaba errores al guardar credenciales)
 *
 * Algoritmo para certificados: AES-256-GCM + PBKDF2 (derivación de clave)
 * - GCM mode proporciona autenticación + confidencialidad
 * - PBKDF2 con 120,000 iteraciones (resistente a fuerza bruta)
 * - Salt aleatorio para cada encriptación
 *
 * ⚠️ CRÍTICO: ENCRYPTION_KEY NUNCA debe ser hardcodeado
 */

import crypto from 'crypto';

