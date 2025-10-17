/**
 * Configuración de The Factory HKA
 * Maneja las credenciales y URLs para demo y producción
 */

export interface HKAConfig {
  environment: 'demo' | 'production'
  soapUrl: string
  restUrl: string
  tokenUser: string
  tokenPassword: string
}

export function getHKAConfig(): HKAConfig {
  const environment = (process.env.HKA_ENV as 'demo' | 'production') || 'demo'
  
  if (environment === 'demo') {
    return {
      environment: 'demo',
      soapUrl: process.env.HKA_DEMO_SOAP_URL || 'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
      restUrl: process.env.HKA_DEMO_REST_URL || 'https://demointegracion.thefactoryhka.com.pa',
      tokenUser: process.env.HKA_DEMO_TOKEN_USER || 'walgofugiitj_ws_tfhka',
      tokenPassword: process.env.HKA_DEMO_TOKEN_PASSWORD || 'Octopusp1oQs5'
    }
  }
  
  // Producción
  return {
    environment: 'production',
    soapUrl: process.env.HKA_PROD_SOAP_URL || 'https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
    restUrl: process.env.HKA_PROD_REST_URL || 'https://integracion.thefactoryhka.com.pa',
    tokenUser: process.env.HKA_PROD_TOKEN_USER || '',
    tokenPassword: process.env.HKA_PROD_TOKEN_PASSWORD || ''
  }
}

export function validateHKAConfig(): { isValid: boolean; errors: string[] } {
  const config = getHKAConfig()
  const errors: string[] = []
  
  if (!config.soapUrl) {
    errors.push('HKA SOAP URL no configurada')
  }
  
  if (!config.restUrl) {
    errors.push('HKA REST URL no configurada')
  }
  
  if (!config.tokenUser) {
    errors.push('HKA Token User no configurado')
  }
  
  if (!config.tokenPassword) {
    errors.push('HKA Token Password no configurado')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function getHKAEnvironment(): string {
  return process.env.HKA_ENV || 'demo'
}

export function isHKAProduction(): boolean {
  return getHKAEnvironment() === 'production'
}

export function isHKADemo(): boolean {
  return getHKAEnvironment() === 'demo'
}
