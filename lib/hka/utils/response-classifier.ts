/**
 * HKA Response Classifier
 * Clasifica respuestas de HKA según código de respuesta
 * Gestiona almacenamiento y recuperación en BD
 */

import { HKA_RESPONSE_CODES } from '@/lib/hka/constants/catalogs';

export interface ClassifiedHkaResponse {
  // Clasificación
  isSuccess: boolean;
  category: 'success' | 'error' | 'processing' | 'unknown';

  // Datos de respuesta
  responseCode: string;
  responseMessage: string;
  friendlyMessage: string;

  // Datos de la factura (si están disponibles)
  cufe?: string;
  cafe?: string;
  numeroDocumentoFiscal?: string;
  protocoloAutorizacion?: string;
  protocoloSeguridad?: string;
  qrUrl?: string;
  qrCode?: string; // Base64
  pdfBase64?: string;

  // Datos técnicos
  timestamp: Date;
  responseData?: Record<string, any>;
}

/**
 * Mapeo de códigos HKA a categorías y mensajes amigables
 */
const HKA_CODE_MAPPING: Record<string, {
  category: 'success' | 'error' | 'processing';
  friendlyMessage: string;
  isSuccess: boolean;
}> = {
  // Códigos de éxito (según Blueprint HKA Panamá)
  '00': {
    category: 'success',
    friendlyMessage: 'Factura procesada exitosamente',
    isSuccess: true,
  },
  '200': {
    category: 'success',
    friendlyMessage: 'Consulta exitosa',
    isSuccess: true,
  },
  '0260': {
    category: 'success',
    friendlyMessage: 'Factura electrónica autorizada exitosamente',
    isSuccess: true,
  },
  '0422': {
    category: 'success',
    friendlyMessage: 'Consulta de factura electrónica exitosa',
    isSuccess: true,
  },
  '0600': {
    category: 'success',
    friendlyMessage: 'Evento de anulación registrado con éxito',
    isSuccess: true,
  },

  // Código de procesamiento
  '100': {
    category: 'processing',
    friendlyMessage: 'Factura en procesamiento, por favor espera...',
    isSuccess: false,
  },

  // Códigos de error comunes
  '01': {
    category: 'error',
    friendlyMessage: 'Error de autenticación con HKA',
    isSuccess: false,
  },
  '02': {
    category: 'error',
    friendlyMessage: 'Error en la validación de datos de la factura',
    isSuccess: false,
  },
  '03': {
    category: 'error',
    friendlyMessage: 'Error del sistema en HKA',
    isSuccess: false,
  },
  '04': {
    category: 'error',
    friendlyMessage: 'Documento duplicado - Esta factura ya fue procesada',
    isSuccess: false,
  },
  '05': {
    category: 'error',
    friendlyMessage: 'Folios insuficientes para emitir esta factura',
    isSuccess: false,
  },
  '06': {
    category: 'error',
    friendlyMessage: 'Ruc no válido',
    isSuccess: false,
  },
  '07': {
    category: 'error',
    friendlyMessage: 'Cédula no válida',
    isSuccess: false,
  },
  '08': {
    category: 'error',
    friendlyMessage: 'DV (Dígito verificador) incorrecto',
    isSuccess: false,
  },
  '09': {
    category: 'error',
    friendlyMessage: 'Error al procesar XML',
    isSuccess: false,
  },
  '10': {
    category: 'error',
    friendlyMessage: 'Error en firma digital',
    isSuccess: false,
  },
};

/**
 * Clasifica una respuesta HKA
 * @param responseCode Código de respuesta HKA
 * @param responseMessage Mensaje de respuesta HKA
 * @param responseData Datos adicionales de respuesta
 * @returns Respuesta clasificada
 */
export function classifyHkaResponse(
  responseCode: string,
  responseMessage: string,
  responseData?: Record<string, any>
): Omit<ClassifiedHkaResponse, 'timestamp'> {
  const mapping = HKA_CODE_MAPPING[responseCode] || {
    category: 'unknown' as const,
    friendlyMessage: responseMessage || 'Respuesta desconocida de HKA',
    isSuccess: false,
  };

  return {
    responseCode,
    responseMessage,
    friendlyMessage: mapping.friendlyMessage || responseMessage,
    isSuccess: mapping.isSuccess,
    category: mapping.category as any,
    cufe: responseData?.cufe,
    cafe: responseData?.cafe,
    numeroDocumentoFiscal: responseData?.numeroDocumentoFiscal,
    protocoloAutorizacion: responseData?.protocoloAutorizacion,
    protocoloSeguridad: responseData?.protocoloSeguridad,
    qrUrl: responseData?.qrUrl,
    qrCode: responseData?.qrCode,
    pdfBase64: responseData?.pdfBase64,
    responseData,
  };
}

/**
 * Obtiene información de un código HKA
 * @param code Código HKA
 * @returns Información del código
 */
export function getHkaCodeInfo(code: string) {
  return HKA_CODE_MAPPING[code] || {
    category: 'unknown',
    friendlyMessage: 'Código HKA desconocido',
    isSuccess: false,
  };
}

/**
 * Verifica si un código es de éxito
 * @param code Código HKA
 * @returns true si es código de éxito
 */
export function isSuccessCode(code: string): boolean {
  const info = HKA_CODE_MAPPING[code];
  return info ? info.isSuccess : false;
}

/**
 * Verifica si un código indica procesamiento
 * @param code Código HKA
 * @returns true si está en procesamiento
 */
export function isProcessingCode(code: string): boolean {
  const info = HKA_CODE_MAPPING[code];
  return info?.category === 'processing';
}

/**
 * Verifica si un código es de error
 * @param code Código HKA
 * @returns true si es error
 */
export function isErrorCode(code: string): boolean {
  const info = HKA_CODE_MAPPING[code];
  return info?.category === 'error';
}

/**
 * Obtiene todos los códigos de éxito
 */
export function getSuccessCodes(): string[] {
  return Object.entries(HKA_CODE_MAPPING)
    .filter(([_, info]) => info.isSuccess)
    .map(([code]) => code);
}

/**
 * Obtiene todos los códigos de error
 */
export function getErrorCodes(): string[] {
  return Object.entries(HKA_CODE_MAPPING)
    .filter(([_, info]) => info.category === 'error')
    .map(([code]) => code);
}

/**
 * Genera resumen de respuesta para presentar al usuario
 * @param response Respuesta clasificada
 * @returns Resumen legible
 */
export function generateResponseSummary(response: Omit<ClassifiedHkaResponse, 'timestamp'>): string {
  const lines: string[] = [];

  lines.push(`📋 Clasificación: ${response.category.toUpperCase()}`);
  lines.push(`📌 Código: ${response.responseCode}`);

  if (response.isSuccess) {
    lines.push(`✅ Estado: EXITOSO`);
  } else if (response.category === 'processing') {
    lines.push(`⏳ Estado: EN PROCESAMIENTO`);
  } else {
    lines.push(`❌ Estado: ERROR`);
  }

  lines.push(`📝 Mensaje: ${response.friendlyMessage}`);

  if (response.cufe) {
    lines.push(`🔐 CUFE: ${response.cufe}`);
  }

  if (response.numeroDocumentoFiscal) {
    lines.push(`📄 Número Fiscal: ${response.numeroDocumentoFiscal}`);
  }

  if (response.protocoloAutorizacion) {
    lines.push(`🔑 Protocolo: ${response.protocoloAutorizacion}`);
  }

  return lines.join('\n');
}
