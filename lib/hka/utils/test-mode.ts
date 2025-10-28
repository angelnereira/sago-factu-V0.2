/**
 * Modo de Prueba para HKA
 * Permite desarrollar y probar sin depender del servidor real de HKA
 */

import { EnviarDocumentoResponse, ConsultarDocumentoResponse, ConsultarFoliosResponse } from '../soap/types';

export interface HKATestModeConfig {
  enabled: boolean;
  simulateErrors: boolean;
  errorRate: number; // 0-1, probabilidad de error
  responseDelay: number; // ms
}

/**
 * Configuración del modo de prueba
 */
export function getHKATestModeConfig(): HKATestModeConfig {
  return {
    enabled: process.env.HKA_MODO_PRUEBA === 'true',
    simulateErrors: process.env.HKA_SIMULAR_ERRORES === 'true',
    errorRate: parseFloat(process.env.HKA_ERROR_RATE || '0.1'),
    responseDelay: parseInt(process.env.HKA_RESPONSE_DELAY || '1000')
  };
}

/**
 * Simula una respuesta exitosa de envío de documento
 */
export function simularEnviarDocumento(
  xmlDocumento: string,
  invoiceId: string
): EnviarDocumentoResponse {
  const config = getHKATestModeConfig();
  
  // Simular delay de red
  if (config.responseDelay > 0) {
    // En modo real esto sería async, pero para simplicidad lo mantenemos sync
  }
  
  // Generar CUFE de prueba
  const cufe = generarCUFEPrueba(xmlDocumento);
  
  return {
    dCodRes: '0200',
    dMsgRes: 'Documento procesado exitosamente (modo prueba)',
    dCufe: cufe,
    dProtocolo: `PROTOCOLO-PRUEBA-${invoiceId}`,
    dFechaHora: new Date().toISOString(),
    dEstado: 'PROCESADO'
  };
}

/**
 * Simula una respuesta de consulta de documento
 */
export function simularConsultarDocumento(
  cufe: string
): ConsultarDocumentoResponse {
  return {
    dCodRes: '0200',
    dMsgRes: 'Documento encontrado (modo prueba)',
    dCufe: cufe,
    dEstado: 'PROCESADO',
    dFechaHora: new Date().toISOString(),
    dProtocolo: `PROTOCOLO-PRUEBA-${cufe.slice(-8)}`
  };
}

/**
 * Simula una respuesta de consulta de folios
 */
export function simularConsultarFolios(): ConsultarFoliosResponse {
  return {
    dCodRes: '0200',
    dMsgRes: 'Folios consultados exitosamente (modo prueba)',
    dFoliosDisponibles: 1000,
    dFoliosUsados: 500,
    dFoliosTotal: 1500,
    dFechaHora: new Date().toISOString()
  };
}

/**
 * Genera un CUFE de prueba basado en el XML
 */
function generarCUFEPrueba(xmlDocumento: string): string {
  // Generar un CUFE de prueba basado en el contenido del XML
  const timestamp = Date.now();
  const hash = xmlDocumento.length.toString(16).padStart(8, '0');
  
  return `CUFE-PRUEBA-${hash}-${timestamp}`;
}

/**
 * Simula un error de HKA
 */
export function simularErrorHKA(tipoError: 'RUC_NO_REGISTRADO' | 'FOLIOS_INSUFICIENTES' | 'XML_INVALIDO' | 'SERVIDOR_ERROR'): EnviarDocumentoResponse {
  const errores = {
    RUC_NO_REGISTRADO: {
      dCodRes: '0400',
      dMsgRes: 'RUC no registrado en el sistema HKA',
      dCufe: '',
      dProtocolo: '',
      dFechaHora: new Date().toISOString(),
      dEstado: 'ERROR'
    },
    FOLIOS_INSUFICIENTES: {
      dCodRes: '0401',
      dMsgRes: 'Folios insuficientes para procesar el documento',
      dCufe: '',
      dProtocolo: '',
      dFechaHora: new Date().toISOString(),
      dEstado: 'ERROR'
    },
    XML_INVALIDO: {
      dCodRes: '0402',
      dMsgRes: 'XML del documento no es válido',
      dCufe: '',
      dProtocolo: '',
      dFechaHora: new Date().toISOString(),
      dEstado: 'ERROR'
    },
    SERVIDOR_ERROR: {
      dCodRes: '0500',
      dMsgRes: 'Error interno del servidor HKA',
      dCufe: '',
      dProtocolo: '',
      dFechaHora: new Date().toISOString(),
      dEstado: 'ERROR'
    }
  };
  
  return errores[tipoError];
}

/**
 * Determina si debe simular un error basado en la configuración
 */
export function debeSimularError(): boolean {
  const config = getHKATestModeConfig();
  
  if (!config.simulateErrors) {
    return false;
  }
  
  return Math.random() < config.errorRate;
}

/**
 * Wrapper para métodos HKA que puede usar modo de prueba o modo real
 */
export class HKATestModeWrapper {
  private config: HKATestModeConfig;
  
  constructor() {
    this.config = getHKATestModeConfig();
  }
  
  /**
   * Envía un documento (modo prueba o real)
   */
  async enviarDocumento(
    xmlDocumento: string,
    invoiceId: string,
    metodoReal: () => Promise<EnviarDocumentoResponse>
  ): Promise<EnviarDocumentoResponse> {
    
    if (this.config.enabled) {
      console.log(`🧪 [HKA TEST MODE] Simulando envío de documento ${invoiceId}`);
      
      if (debeSimularError()) {
        const tipoError = this.obtenerTipoErrorAleatorio();
        console.log(`🧪 [HKA TEST MODE] Simulando error: ${tipoError}`);
        return simularErrorHKA(tipoError);
      }
      
      return simularEnviarDocumento(xmlDocumento, invoiceId);
    }
    
    // Modo real
    return await metodoReal();
  }
  
  /**
   * Consulta un documento (modo prueba o real)
   */
  async consultarDocumento(
    cufe: string,
    metodoReal: () => Promise<ConsultarDocumentoResponse>
  ): Promise<ConsultarDocumentoResponse> {
    
    if (this.config.enabled) {
      console.log(`🧪 [HKA TEST MODE] Simulando consulta de documento ${cufe}`);
      return simularConsultarDocumento(cufe);
    }
    
    // Modo real
    return await metodoReal();
  }
  
  /**
   * Consulta folios (modo prueba o real)
   */
  async consultarFolios(
    metodoReal: () => Promise<ConsultarFoliosResponse>
  ): Promise<ConsultarFoliosResponse> {
    
    if (this.config.enabled) {
      console.log(`🧪 [HKA TEST MODE] Simulando consulta de folios`);
      return simularConsultarFolios();
    }
    
    // Modo real
    return await metodoReal();
  }
  
  /**
   * Obtiene un tipo de error aleatorio para simulación
   */
  private obtenerTipoErrorAleatorio(): 'RUC_NO_REGISTRADO' | 'FOLIOS_INSUFICIENTES' | 'XML_INVALIDO' | 'SERVIDOR_ERROR' {
    const errores: Array<'RUC_NO_REGISTRADO' | 'FOLIOS_INSUFICIENTES' | 'XML_INVALIDO' | 'SERVIDOR_ERROR'> = [
      'RUC_NO_REGISTRADO',
      'FOLIOS_INSUFICIENTES', 
      'XML_INVALIDO',
      'SERVIDOR_ERROR'
    ];
    
    return errores[Math.floor(Math.random() * errores.length)];
  }
  
  /**
   * Verifica si está en modo de prueba
   */
  isTestMode(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Obtiene la configuración actual
   */
  getConfig(): HKATestModeConfig {
    return { ...this.config };
  }
}

/**
 * Instancia global del wrapper de modo de prueba
 */
export const hkaTestModeWrapper = new HKATestModeWrapper();
