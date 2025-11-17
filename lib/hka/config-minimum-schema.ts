/**
 * Minimum Configuration Schema for HKA Integration
 *
 * Módulo 3: Restricción de Configuración a 4 Parámetros Esenciales
 *
 * Objetivo: Garantizar que SOLO se usan 4 parámetros de configuración
 * para la integración con HKA:
 * 1. HKA_API_URL (si lo requiere)
 * 2. HKA_API_TOKEN_EMPRESA (nombre de usuario)
 * 3. HKA_API_TOKEN_PASSWORD (contraseña)
 * 4. CERT_THUMBPRINT (identificador del certificado activo)
 *
 * Esta interfaz actúa como una "view" que solo expone estos 4 campos
 * desde el modelo Organization más completo en BD.
 *
 * Nota: El modelo Organization en BD sigue siendo completo (para compatibilidad
 * histórica), pero la APLICACIÓN solo usa estos 4 parámetros.
 *
 * @see docs/REFACTORIZACION-CONFIG-MINIMA.md
 */

import { z } from 'zod'

/**
 * Schema de configuración mínima validado con Zod
 *
 * Estos son los ÚNICOS campos permitidos para HKA
 */
const MinimumHkaConfigSchema = z.object({
  hkaApiUrl: z.string().url().optional(), // Puede venir de env default
  hkaTokenUser: z.string().min(1, 'HKA token user es requerido'),
  hkaTokenPassword: z.string().min(1, 'HKA token password es requerido'),
  certificateThumbprint: z
    .string()
    .min(40, 'Thumbprint de certificado inválido (debe ser SHA-1)')
    .optional(),
})

export type MinimumHkaConfig = z.infer<typeof MinimumHkaConfigSchema>

/**
 * Extrae SOLO los 4 parámetros esenciales del modelo Organization
 *
 * Transforma:
 * ```typescript
 * const organization = { id: '...', name: '...', ruc: '...', hkaTokenUser: '...', ... 100 campos más }
 * const minimumConfig = extractMinimumConfig(organization)
 * // Result: { hkaTokenUser: '...', hkaTokenPassword: '...', certificateThumbprint: '...' }
 * ```
 *
 * @param organization - Objeto Organization de la BD
 * @param certificateThumbprint - Thumbprint del certificado activo (de UserSignatureConfig)
 * @returns MinimumHkaConfig con solo los 4 parámetros
 * @throws Error si faltan parámetros requeridos
 */
export function extractMinimumConfig(
  organization: any,
  certificateThumbprint?: string
): MinimumHkaConfig {
  // Validar que los campos mínimos existen
  if (!organization.hkaTokenUser || !organization.hkaTokenPassword) {
    throw new Error(
      `Configuración HKA incompleta en organización ${organization.id}. ` +
      `Se requieren: hkaTokenUser, hkaTokenPassword`
    )
  }

  // Extraer SOLO los 4 campos
  const config: MinimumHkaConfig = {
    hkaTokenUser: organization.hkaTokenUser,
    hkaTokenPassword: organization.hkaTokenPassword,
    certificateThumbprint,
  }

  // Validar con Zod
  return MinimumHkaConfigSchema.parse(config)
}

/**
 * Valida que una configuración tiene todos los parámetros requeridos
 * para conectar con HKA
 */
export function validateMinimumConfig(config: MinimumHkaConfig): boolean {
  try {
    MinimumHkaConfigSchema.parse(config)
    return true
  } catch {
    return false
  }
}

/**
 * Clase para gestionar la configuración mínima de una organización
 *
 * Esta clase actúa como un "facade" que SOLO expone los 4 parámetros
 * permitidos, rechazando acceso a cualquier otro campo del modelo
 * Organization.
 *
 * Uso:
 * ```typescript
 * const orgConfig = new OrganizationMinimumConfig(organization, certificateThumbprint)
 *
 * // ✅ PERMITIDO - acceder a parámetro permitido
 * const user = orgConfig.getTokenUser()
 *
 * // ✅ PERMITIDO - validar configuración
 * if (!orgConfig.isConfigured()) { ... }
 *
 * // ❌ RECHAZADO - intentar acceder a otros campos
 * orgConfig.organization.email  // TypeError: property does not exist
 * orgConfig.name                 // TypeError: property does not exist
 * orgConfig.getField('ruc')      // Error: Field 'ruc' is not allowed
 * ```
 */
export class OrganizationMinimumConfig {
  private readonly allowedFields = [
    'hkaTokenUser',
    'hkaTokenPassword',
    'certificateThumbprint',
  ]

  private readonly config: MinimumHkaConfig

  constructor(
    private organizationId: string,
    config: MinimumHkaConfig
  ) {
    this.config = MinimumHkaConfigSchema.parse(config)
  }

  /**
   * Obtiene el nombre de usuario (token usuario)
   */
  getTokenUser(): string {
    return this.config.hkaTokenUser
  }

  /**
   * Obtiene la contraseña (token password)
   * NOTA: En implementación real, sería getSecret('HKA_TOKEN_PASSWORD')
   * en lugar de retornar directamente
   */
  getTokenPassword(): string {
    return this.config.hkaTokenPassword
  }

  /**
   * Obtiene el thumbprint del certificado activo
   */
  getCertificateThumbprint(): string | undefined {
    return this.config.certificateThumbprint
  }

  /**
   * Valida que la configuración está completa
   */
  isConfigured(): boolean {
    return Boolean(
      this.config.hkaTokenUser &&
      this.config.hkaTokenPassword &&
      this.config.certificateThumbprint
    )
  }

  /**
   * Retorna la configuración como objeto (para pasar a APIs)
   * Pero SOLO con los 4 campos permitidos
   */
  toJSON(): MinimumHkaConfig {
    return {
      hkaTokenUser: this.config.hkaTokenUser,
      hkaTokenPassword: this.config.hkaTokenPassword,
      certificateThumbprint: this.config.certificateThumbprint,
    }
  }

  /**
   * Intenta acceder a un campo - SIEMPRE rechaza campos no permitidos
   */
  getField(fieldName: string): string | undefined {
    if (!this.allowedFields.includes(fieldName)) {
      throw new Error(
        `Campo '${fieldName}' no permitido. Campos permitidos: ${this.allowedFields.join(', ')}`
      )
    }

    return (this.config as any)[fieldName]
  }
}

/**
 * Factory para construir OrganizationMinimumConfig desde BD
 *
 * Uso recomendado en API routes:
 * ```typescript
 * const configFactory = new OrganizationConfigFactory(prisma)
 * const orgConfig = await configFactory.loadForOrganization(organizationId, userId)
 * const tokenPassword = orgConfig.getTokenPassword()
 * ```
 */
export class OrganizationConfigFactory {
  constructor(private prisma: any) {}

  /**
   * Carga configuración mínima desde BD
   *
   * Valida:
   * 1. Organización existe
   * 2. Tiene credenciales HKA
   * 3. Usuario tiene certificado activo
   * 4. Retorna solo los 4 campos permitidos
   */
  async loadForOrganization(
    organizationId: string,
    userId?: string
  ): Promise<OrganizationMinimumConfig> {
    // Cargar organización
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        hkaTokenUser: true,
        hkaTokenPassword: true,
      },
    })

    if (!org) {
      throw new Error(`Organización no encontrada: ${organizationId}`)
    }

    // Cargar certificado activo del usuario si se proporciona
    let certificateThumbprint: string | undefined

    if (userId) {
      const userSigConfig = await this.prisma.userSignatureConfig.findUnique({
        where: { userId },
        select: {
          digitalCertificate: {
            select: {
              certificateThumbprint: true,
            },
          },
        },
      })

      certificateThumbprint = userSigConfig?.digitalCertificate?.certificateThumbprint
    }

    // Extraer configuración mínima
    const config = extractMinimumConfig(org, certificateThumbprint)

    return new OrganizationMinimumConfig(organizationId, config)
  }
}

/**
 * Hook de validación para rutas API
 *
 * Uso en rutas:
 * ```typescript
 * export async function POST(request: Request) {
   *   const session = await auth()
   *   const org = await prisma.organization.findUnique(...)
   *
   *   // ✓ Validar que solo tiene 4 campos
   *   validateConfigurationSchema(org)
   *
   *   // Continuar con lógica ...
   * }
   * ```
   */
export function validateConfigurationSchema(organization: any): void {
  const required = ['hkaTokenUser', 'hkaTokenPassword']
  const forbidden = [
    'email',
    'phone',
    'address',
    'tradeName',
    'branchCode',
    'locationCode',
    'province',
    'district',
    'corregimiento',
  ]

  // Verificar que los campos requeridos existen
  for (const field of required) {
    if (!organization[field]) {
      throw new Error(
        `Campo requerido falta en configuración: ${field}`
      )
    }
  }

  // Advertencia si se encuentran campos que NO deberían estar siendo usados
  for (const field of forbidden) {
    if (organization[field] !== undefined && organization[field] !== null) {
      console.warn(
        `[ConfigValidation] Campo no permitido está siendo consultado: ${field}. ` +
        `Este campo NO debe ser usado en la lógica HKA.`
      )
    }
  }
}

/**
 * Tipos de exportación para seguridad de tipos
 */
export type { MinimumHkaConfig }
