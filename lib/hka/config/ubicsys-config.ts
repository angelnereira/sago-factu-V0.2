/**
 * Configuración específica de UBICSYS para HKA
 * Datos oficiales de la cuenta de UBICSYS en HKA
 */

export interface UBICSYSConfig {
  // Datos del Contribuyente UBICSYS
  ruc: string;
  dv: string;
  razonSocial: string;
  nombreComercial: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  certificadoValidoHasta: string;
  
  // Domicilio Fiscal
  pais: string;
  provincia: string;
  distrito: string;
  corregimiento: string;
  direccion: string;
  
  // Credenciales HKA
  tokenUser: string;
  tokenPassword: string;
  portalUrl: string;
  portalUser: string;
  portalPassword: string;
}

/**
 * Obtiene la configuración oficial de UBICSYS
 */
export function getUBICSYSConfig(): UBICSYSConfig {
  return {
    // Datos del Contribuyente (copiados de HKA)
    ruc: '155738031-2-2023',
    dv: '20',
    razonSocial: 'SAGO PANAMA, S.A.',
    nombreComercial: 'UBICSYS',
    email: 'soporte@ubicsys.com',
    telefono: '6410-5658',
    fechaRegistro: '08-09-2025',
    certificadoValidoHasta: '08-09-2027 16:41:13',
    
    // Domicilio Fiscal
    pais: 'Panamá',
    provincia: 'Colon',
    distrito: 'Colon',
    corregimiento: 'Barrio Norte',
    direccion: 'CALLE SANTA ISABEL, EDIFICIO: HOTEL MERYLAND',
    
    // Credenciales HKA (proporcionadas por soporte)
    tokenUser: 'walgofugiitj_ws_tfhka',
    tokenPassword: 'Octopusp1oQs5',
    portalUrl: 'https://demo.thefactoryhka.com.pa/',
    portalUser: 'soporte@ubicsys.com',
    portalPassword: 'Cactus4obk01B$m'
  };
}

/**
 * Valida que el RUC de UBICSYS sea correcto
 */
export function validarRUCUBICSYS(): { isValid: boolean; errors: string[] } {
  const config = getUBICSYSConfig();
  const rucCompleto = `${config.ruc}-${config.dv}`;
  
  // Importar validador dinámicamente para evitar dependencias circulares
  const { validarRUCCompleto } = require('./utils/ruc-validator');
  
  return validarRUCCompleto(rucCompleto);
}

/**
 * Obtiene el RUC completo de UBICSYS para usar en XMLs
 */
export function getRUCUBICSYSCompleto(): string {
  const config = getUBICSYSConfig();
  return `${config.ruc}-${config.dv}`;
}

/**
 * Obtiene los datos del emisor para XMLs
 */
export function getDatosEmisorUBICSYS() {
  const config = getUBICSYSConfig();
  
  return {
    ruc: config.ruc,
    dv: config.dv,
    razonSocial: config.razonSocial,
    nombreComercial: config.nombreComercial,
    email: config.email,
    telefono: config.telefono,
    pais: config.pais,
    provincia: config.provincia,
    distrito: config.distrito,
    corregimiento: config.corregimiento,
    direccion: config.direccion
  };
}

/**
 * Verifica si el certificado de UBICSYS está vigente
 */
export function verificarCertificadoUBICSYS(): { vigente: boolean; diasRestantes: number } {
  const config = getUBICSYSConfig();
  const fechaVencimiento = new Date(config.certificadoValidoHasta);
  const hoy = new Date();
  
  const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    vigente: diasRestantes > 0,
    diasRestantes: Math.max(0, diasRestantes)
  };
}
