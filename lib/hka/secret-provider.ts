/**
 * IHkaSecretProvider - Secret Management Interface
 *
 * Módulo 1: Gestión de Tokens HKA
 *
 * Esta interfaz abstrae la obtención de secretos (tokens HKA) delegando
 * la responsabilidad de seguridad al sistema operativo o Secret Vault,
 * eliminando la necesidad de cifrado/descifrado customizado en la aplicación.
 *
 * El proveedor NUNCA lee credenciales almacenadas en base de datos encriptadas.
 * Las credenciales siempre vienen del sistema operativo, variables de entorno,
 * o un Secret Vault externo.
 *
 * Arquitectura:
 * - NO cifra/descifra secretos (responsabilidad del SO)
 * - Valida existencia de secretos antes de usarlos
 * - Soporta múltiples ambientes (demo/prod)
 * - Falla rápido si secreto no existe
 *
 * @see docs/REFACTORIZACION-TOKENS-HKA.md para contexto
 */

/**
 * Errores específicos para manejo de secretos
 */
export class SecretProviderError extends Error {
  constructor(
    public code:
      | 'SECRET_NOT_FOUND'
      | 'INVALID_SECRET'
      | 'PROVIDER_ERROR',
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'SecretProviderError'
  }
}

/**
 * Interfaz para proveedores de secretos
 */
export interface IHkaSecretProvider {
  /**
   * Obtiene un secreto específico del proveedor de secretos
   *
   * @param secretId - Identificador del secreto (ej: 'HKA_DEMO_TOKEN_PASSWORD')
   * @param options - Opciones adicionales (ej: { environment: 'prod' })
   * @returns Valor del secreto en texto plano
   * @throws SecretProviderError si el secreto no existe o hay error
   */
  getSecret(
    secretId: string,
    options?: {
      environment?: 'demo' | 'prod'
      fallback?: string
    }
  ): Promise<string>

  /**
   * Valida que un secreto existe sin obtener su valor
   *
   * @param secretId - Identificador del secreto
   * @returns true si existe, false si no
   */
  secretExists(secretId: string): Promise<boolean>

  /**
   * Obtiene múltiples secretos de una vez (más eficiente)
   *
   * @param secretIds - Array de identificadores
   * @returns Map con secretId → value
   * @throws SecretProviderError si alguno falta
   */
  getSecrets(secretIds: string[]): Promise<Map<string, string>>
}

/**
 * Implementación: Environment Variable Secret Provider
 *
 * Lee secretos SOLO de variables de entorno del sistema operativo.
 * Esta es la implementación recomendada para la mayoría de casos.
 *
 * Nota: Las credenciales en database (Organization.hkaTokenPassword)
 * se ignoran completamente. Solo se usan credenciales del SO.
 */
export class EnvironmentSecretProvider implements IHkaSecretProvider {
  private readonly prefix = 'HKA_'
  private readonly logger = console

  async getSecret(
    secretId: string,
    options?: { environment?: 'demo' | 'prod'; fallback?: string }
  ): Promise<string> {
    try {
      // Construir nombre de variable de entorno
      const envVarName = this.buildEnvVarName(secretId, options?.environment)

      // Buscar en process.env
      const value = process.env[envVarName]

      if (!value) {
        // Intentar fallback si se proporciona
        if (options?.fallback) {
          this.logger.warn(
            `[SecretProvider] ${envVarName} no encontrado, usando fallback`
          )
          return options.fallback
        }

        throw new SecretProviderError(
          'SECRET_NOT_FOUND',
          `Variable de entorno ${envVarName} no configurada`,
          { envVarName }
        )
      }

      // Validar que no está vacío
      if (value.trim().length === 0) {
        throw new SecretProviderError(
          'INVALID_SECRET',
          `Variable ${envVarName} está vacía`,
          { envVarName }
        )
      }

      return value
    } catch (error) {
      if (error instanceof SecretProviderError) {
        throw error
      }
      throw new SecretProviderError(
        'PROVIDER_ERROR',
        `Error obteniendo secreto: ${error}`,
        error
      )
    }
  }

  async secretExists(secretId: string): Promise<boolean> {
    const envVarName = this.buildEnvVarName(secretId)
    return Boolean(process.env[envVarName])
  }

  async getSecrets(secretIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>()

    for (const id of secretIds) {
      try {
        const value = await this.getSecret(id)
        result.set(id, value)
      } catch (error) {
        if (error instanceof SecretProviderError && error.code === 'SECRET_NOT_FOUND') {
          // Log pero continúa con otros secretos
          this.logger.warn(`[SecretProvider] ${id} no encontrado`)
        } else {
          throw error
        }
      }
    }

    return result
  }

  /**
   * Construye el nombre de la variable de entorno
   *
   * Ejemplos:
   * - buildEnvVarName('TOKEN_PASSWORD', 'demo') → 'HKA_DEMO_TOKEN_PASSWORD'
   * - buildEnvVarName('TOKEN_PASSWORD', 'prod') → 'HKA_PROD_TOKEN_PASSWORD'
   * - buildEnvVarName('TOKEN_PASSWORD') → 'HKA_TOKEN_PASSWORD'
   */
  private buildEnvVarName(
    secretId: string,
    environment?: 'demo' | 'prod'
  ): string {
    if (environment) {
      return `${this.prefix}${environment.toUpperCase()}_${secretId}`
    }
    return `${this.prefix}${secretId}`
  }
}

/**
 * Implementación: Vault Secret Provider (placeholder para AWS Secrets Manager, etc.)
 *
 * Esta es una estructura lista para integración con servicios como:
 * - AWS Secrets Manager
 * - Azure Key Vault
 * - HashiCorp Vault
 * - Google Secret Manager
 *
 * Nota: Requiere SDK específico del servicio
 */
export class VaultSecretProvider implements IHkaSecretProvider {
  constructor(
    private vaultClient: any // Cliente del vault específico
  ) {}

  async getSecret(
    secretId: string,
    options?: { environment?: 'demo' | 'prod'; fallback?: string }
  ): Promise<string> {
    try {
      const secretPath = this.buildSecretPath(secretId, options?.environment)
      const secret = await this.vaultClient.getSecret(secretPath)

      if (!secret) {
        if (options?.fallback) {
          return options.fallback
        }
        throw new SecretProviderError(
          'SECRET_NOT_FOUND',
          `Secreto no encontrado en vault: ${secretPath}`
        )
      }

      return secret
    } catch (error) {
      if (error instanceof SecretProviderError) {
        throw error
      }
      throw new SecretProviderError(
        'PROVIDER_ERROR',
        `Error obteniendo de vault: ${error}`
      )
    }
  }

  async secretExists(secretId: string): Promise<boolean> {
    try {
      const secretPath = this.buildSecretPath(secretId)
      return await this.vaultClient.hasSecret(secretPath)
    } catch {
      return false
    }
  }

  async getSecrets(secretIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>()

    for (const id of secretIds) {
      const secret = await this.getSecret(id)
      result.set(id, secret)
    }

    return result
  }

  private buildSecretPath(
    secretId: string,
    environment?: 'demo' | 'prod'
  ): string {
    const env = environment || 'demo'
    return `/hka/${env}/${secretId}`
  }
}

/**
 * Singleton global para el proveedor de secretos
 *
 * Uso:
 * ```typescript
 * const secretProvider = getSecretProvider()
 * const password = await secretProvider.getSecret('TOKEN_PASSWORD', { environment: 'demo' })
 * ```
 */
let globalSecretProvider: IHkaSecretProvider | null = null

export function setSecretProvider(provider: IHkaSecretProvider): void {
  globalSecretProvider = provider
}

export function getSecretProvider(): IHkaSecretProvider {
  if (!globalSecretProvider) {
    // Por defecto usar Environment Provider
    globalSecretProvider = new EnvironmentSecretProvider()
  }
  return globalSecretProvider
}

/**
 * Hook de inicialización para aplicaciones
 *
 * Llamar en el startup de la aplicación para validar que
 * los secretos requeridos están disponibles
 */
export async function initializeSecretProvider(
  requiredSecrets?: string[]
): Promise<void> {
  const provider = getSecretProvider()

  // Validar secretos requeridos
  const secrets = requiredSecrets || [
    'DEMO_TOKEN_USER',
    'DEMO_TOKEN_PASSWORD',
  ]

  for (const secret of secrets) {
    const exists = await provider.secretExists(secret)
    if (!exists) {
      throw new Error(
        `Secreto requerido no configurado: HKA_${secret}`
      )
    }
  }

  console.log(
    `[SecretProvider] Inicialización exitosa. ${secrets.length} secretos validados.`
  )
}
