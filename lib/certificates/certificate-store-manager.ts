/**
 * Certificate Store Manager - Gestión Segura de Certificados
 *
 * Módulo 2: Implementa el protocolo de aislamiento de certificados
 * con restricción al almacén CurrentUser del usuario que ejecuta la aplicación.
 *
 * Principios:
 * 1. UN SOLO certificado activo por usuario de aplicación
 * 2. Almacén restringido: StoreLocation.CurrentUser
 * 3. Búsqueda por Thumbprint (identificador único)
 * 4. Protocolo de sobreescritura: eliminar anterior antes de importar nuevo
 * 5. Aislamiento de privilegios: X509KeyStorageFlags.UserKeySet
 *
 * Nota: Este módulo es una abstracción. La implementación específica
 * del sistema de certificados depende del SO:
 * - Windows: CAPI (CryptoAPI) vía .NET
 * - Linux: OpenSSL/GnuTLS directamente
 * - macOS: Keychain
 *
 * @see docs/REFACTORIZACION-CERTIFICADOS-SEGURIDAD.md para detalles
 */

import * as fs from 'fs'
import * as path from 'path'
import { hash } from 'crypto'

/**
 * Errores específicos de certificados
 */
export class CertificateStoreError extends Error {
  constructor(
    public code:
      | 'CERT_NOT_FOUND'
      | 'CERT_INVALID'
      | 'CERT_EXPIRED'
      | 'CERT_ALREADY_EXISTS'
      | 'STORE_ERROR'
      | 'IMPORT_ERROR'
      | 'CLEANUP_ERROR',
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'CertificateStoreError'
  }
}

/**
 * Metadatos del certificado
 */
export interface CertificateMetadata {
  thumbprint: string // SHA-1 hash del certificado (identificador único)
  subjectName: string // CN (Common Name) del certificado
  issuerName: string // Emisor
  validFrom: Date // Inicio de validez
  validTo: Date // Fin de validez
  serialNumber: string // Número de serie
  hasPrivateKey: boolean // ¿Tiene clave privada?
  keyStorageLocation: string // Ubicación: CurrentUser | LocalMachine
}

/**
 * Resultado de la importación de certificado
 */
export interface CertificateImportResult {
  success: boolean
  thumbprint: string
  subjectName: string
  validTo: Date
  message: string
  previousCertificateThumbprint?: string // Si hubo uno anterior
}

/**
 * Interfaz para el gestor de almacén de certificados
 */
export interface ICertificateStoreManager {
  /**
   * Importa un certificado PKCS#12 al almacén CurrentUser
   * con protocolo automático de sobreescritura de certificados anteriores
   * con el mismo subjectName
   *
   * Proceso:
   * 1. Validar archivo .p12/.pfx existe y es legible
   * 2. Cargar certificado temporal en memoria
   * 3. Extraer metadatos (thumbprint, subjectName, validez)
   * 4. Validar certificado no está expirado
   * 5. Buscar certificados anteriores con MISMO subjectName
   * 6. ELIMINAR certificados anteriores del almacén
   * 7. Importar nuevo certificado a almacén CurrentUser/Personal
   * 8. Validar importación exitosa
   * 9. Retornar metadatos con thumbprint
   *
   * @param certificateFile - Ruta al archivo .p12 o .pfx
   * @param password - Contraseña del certificado
   * @param options - Opciones adicionales
   * @returns CertificateImportResult con thumbprint
   * @throws CertificateStoreError si hay algún problema
   */
  importCertificate(
    certificateFile: string,
    password: string,
    options?: {
      allowExpired?: boolean // Para testing
      dryRun?: boolean // No actualizar BD, solo validar
    }
  ): Promise<CertificateImportResult>

  /**
   * Busca un certificado en el almacén CurrentUser por su thumbprint
   *
   * @param thumbprint - SHA-1 hash del certificado
   * @returns CertificateMetadata si existe, null si no
   */
  findCertificateByThumbprint(thumbprint: string): Promise<CertificateMetadata | null>

  /**
   * Lista todos los certificados en el almacén CurrentUser
   *
   * @param filterSubjectName - Opcional: filtrar por subject name
   * @returns Array de certificados encontrados
   */
  listCertificates(filterSubjectName?: string): Promise<CertificateMetadata[]>

  /**
   * Elimina un certificado del almacén CurrentUser
   *
   * @param thumbprint - SHA-1 hash del certificado a eliminar
   * @returns true si se eliminó, false si no existía
   * @throws CertificateStoreError si hay error en el proceso
   */
  deleteCertificate(thumbprint: string): Promise<boolean>

  /**
   * Valida que un certificado es válido (no expirado, tiene clave privada, etc.)
   *
   * @param thumbprint - SHA-1 hash del certificado
   * @returns true si es válido para usar, false si no
   */
  validateCertificate(thumbprint: string): Promise<boolean>

  /**
   * Ejecuta el protocolo de limpieza: elimina TODOS los certificados
   * del almacén con un subjectName específico, excepto el que se está
   * importando
   *
   * @param subjectName - Subject name a limpiar
   * @param excludeThumbprint - Opcional: no eliminar este thumbprint
   * @returns Número de certificados eliminados
   */
  cleanupOldCertificates(
    subjectName: string,
    excludeThumbprint?: string
  ): Promise<number>
}

/**
 * Implementación para Linux/Unix usando OpenSSL
 *
 * En Linux, los certificados se manejan a través del sistema de archivos.
 * Implementamos un pseudo-almacén en ~/.config/sago-factu/certs/
 * restringido a permisos 0700 (solo usuario puede leer/escribir)
 */
export class OpenSSLCertificateStoreManager implements ICertificateStoreManager {
  private readonly certsDir: string
  private readonly logger = console

  constructor() {
    // Usar directorio home del usuario actual
    const homeDir = process.env.HOME || process.env.USERPROFILE
    if (!homeDir) {
      throw new CertificateStoreError(
        'STORE_ERROR',
        'No se puede determinar directorio home del usuario'
      )
    }

    this.certsDir = path.join(homeDir, '.config', 'sago-factu', 'certs')

    // Crear directorio si no existe, con permisos restrictivos (0700)
    if (!fs.existsSync(this.certsDir)) {
      fs.mkdirSync(this.certsDir, { recursive: true, mode: 0o700 })
    }
  }

  async importCertificate(
    certificateFile: string,
    password: string,
    options?: { allowExpired?: boolean; dryRun?: boolean }
  ): Promise<CertificateImportResult> {
    try {
      // 1. Validar archivo existe
      if (!fs.existsSync(certificateFile)) {
        throw new CertificateStoreError(
          'CERT_INVALID',
          `Archivo de certificado no encontrado: ${certificateFile}`
        )
      }

      // 2. Extraer certificado del archivo PKCS#12
      const metadata = await this.extractCertificateMetadata(
        certificateFile,
        password
      )

      // 3. Validar no está expirado
      if (!options?.allowExpired && metadata.validTo < new Date()) {
        throw new CertificateStoreError(
          'CERT_EXPIRED',
          `Certificado expirado desde ${metadata.validTo.toISOString()}`
        )
      }

      // 4. Buscar y eliminar certificados anteriores con el mismo subjectName
      let previousThumbprint: string | undefined
      const existingCerts = await this.listCertificates(metadata.subjectName)

      if (!options?.dryRun) {
        for (const cert of existingCerts) {
          if (cert.thumbprint !== metadata.thumbprint) {
            this.logger.warn(
              `[CertStore] Eliminando certificado anterior: ${cert.thumbprint}`
            )
            previousThumbprint = cert.thumbprint
            await this.deleteCertificate(cert.thumbprint)
          }
        }
      }

      // 5. Copiar certificado al almacén de certs
      if (!options?.dryRun) {
        const destFile = path.join(this.certsDir, `${metadata.thumbprint}.p12`)
        fs.copyFileSync(certificateFile, destFile)
        fs.chmodSync(destFile, 0o600) // Permisos restrictivos al usuario
        this.logger.info(`[CertStore] Certificado importado: ${metadata.thumbprint}`)
      }

      return {
        success: true,
        thumbprint: metadata.thumbprint,
        subjectName: metadata.subjectName,
        validTo: metadata.validTo,
        message: `Certificado importado exitosamente. Válido hasta ${metadata.validTo.toDateString()}`,
        previousCertificateThumbprint: previousThumbprint,
      }
    } catch (error) {
      if (error instanceof CertificateStoreError) {
        throw error
      }
      throw new CertificateStoreError(
        'IMPORT_ERROR',
        `Error importando certificado: ${error}`,
        error
      )
    }
  }

  async findCertificateByThumbprint(thumbprint: string): Promise<CertificateMetadata | null> {
    try {
      const certFile = path.join(this.certsDir, `${thumbprint}.p12`)

      if (!fs.existsSync(certFile)) {
        return null
      }

      // En una implementación real, extraeríamos metadatos del archivo P12
      // Por ahora retornamos null indicando que busque en BD
      return null
    } catch (error) {
      this.logger.error(`[CertStore] Error buscando certificado: ${error}`)
      return null
    }
  }

  async listCertificates(filterSubjectName?: string): Promise<CertificateMetadata[]> {
    try {
      if (!fs.existsSync(this.certsDir)) {
        return []
      }

      const files = fs.readdirSync(this.certsDir)
      const certs: CertificateMetadata[] = []

      for (const file of files) {
        if (file.endsWith('.p12')) {
          const thumbprint = file.replace('.p12', '')
          const certFile = path.join(this.certsDir, file)

          try {
            const metadata = await this.extractCertificateMetadata(certFile, '')
            if (!filterSubjectName || metadata.subjectName === filterSubjectName) {
              certs.push(metadata)
            }
          } catch (error) {
            this.logger.warn(`[CertStore] Error extrayendo metadatos de ${file}: ${error}`)
          }
        }
      }

      return certs
    } catch (error) {
      this.logger.error(`[CertStore] Error listando certificados: ${error}`)
      return []
    }
  }

  async deleteCertificate(thumbprint: string): Promise<boolean> {
    try {
      const certFile = path.join(this.certsDir, `${thumbprint}.p12`)

      if (!fs.existsSync(certFile)) {
        return false
      }

      fs.unlinkSync(certFile)
      this.logger.info(`[CertStore] Certificado eliminado: ${thumbprint}`)
      return true
    } catch (error) {
      throw new CertificateStoreError(
        'STORE_ERROR',
        `Error eliminando certificado: ${error}`,
        error
      )
    }
  }

  async validateCertificate(thumbprint: string): Promise<boolean> {
    try {
      const certFile = path.join(this.certsDir, `${thumbprint}.p12`)

      if (!fs.existsSync(certFile)) {
        return false
      }

      const metadata = await this.extractCertificateMetadata(certFile, '')
      return metadata.validTo > new Date()
    } catch (error) {
      return false
    }
  }

  async cleanupOldCertificates(
    subjectName: string,
    excludeThumbprint?: string
  ): Promise<number> {
    try {
      const certs = await this.listCertificates(subjectName)
      let deleted = 0

      for (const cert of certs) {
        if (cert.thumbprint !== excludeThumbprint) {
          const success = await this.deleteCertificate(cert.thumbprint)
          if (success) {
            deleted++
          }
        }
      }

      this.logger.info(
        `[CertStore] Limpieza completada: ${deleted} certificados eliminados`
      )
      return deleted
    } catch (error) {
      throw new CertificateStoreError(
        'CLEANUP_ERROR',
        `Error en limpieza de certificados: ${error}`,
        error
      )
    }
  }

  /**
   * Extrae metadatos de un certificado PKCS#12
   * (Implementación simplificada - en producción usar node-forge o similar)
   */
  private async extractCertificateMetadata(
    certFile: string,
    password: string
  ): Promise<CertificateMetadata> {
    // En una implementación real, aquí usaríamos node-forge o pkcs12:
    // const p12 = forge.pkcs12.asn1.fromDer(...)
    // const cert = p12.getBags({friendlyName: ...})

    // Por ahora, retornar metadatos simulados basados en el archivo
    const fileBuffer = fs.readFileSync(certFile)
    const thumbprint = this.calculateThumbprint(fileBuffer)

    return {
      thumbprint,
      subjectName: 'CN=Test User, O=Test Org, C=PA',
      issuerName: 'Test CA',
      validFrom: new Date('2025-01-01'),
      validTo: new Date('2026-01-01'),
      serialNumber: 'SERIAL_TEST_001',
      hasPrivateKey: true,
      keyStorageLocation: 'CurrentUser',
    }
  }

  /**
   * Calcula el thumbprint SHA-1 de un certificado
   */
  private calculateThumbprint(buffer: Buffer): string {
    return hash('sha1').update(buffer).digest('hex').toUpperCase()
  }
}

/**
 * Singleton global para el gestor de almacén de certificados
 */
let globalCertificateStoreManager: ICertificateStoreManager | null = null

export function setCertificateStoreManager(
  manager: ICertificateStoreManager
): void {
  globalCertificateStoreManager = manager
}

export function getCertificateStoreManager(): ICertificateStoreManager {
  if (!globalCertificateStoreManager) {
    // Por defecto usar OpenSSL manager (funciona en Linux/macOS)
    globalCertificateStoreManager = new OpenSSLCertificateStoreManager()
  }
  return globalCertificateStoreManager
}

/**
 * Hook de inicialización
 *
 * Validar que el almacén de certificados está accesible
 */
export async function initializeCertificateStore(): Promise<void> {
  const manager = getCertificateStoreManager()
  const certs = await manager.listCertificates()
  console.log(
    `[CertificateStore] Inicialización exitosa. ${certs.length} certificados encontrados.`
  )
}
