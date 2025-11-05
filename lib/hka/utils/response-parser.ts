/**
 * Parser robusto de respuestas HKA
 * Maneja diferentes estructuras de respuesta SOAP
 */

import { EnviarDocumentoResponse } from '../soap/types';

export interface ParsedHKAResponse {
  codigo: string;
  resultado: string;
  mensaje: string;
  cufe?: string;
  cafe?: string;
  numeroDocumentoFiscal?: string;
  xmlFirmado?: string;
  pdfBase64?: string;
  codigoQrBase64?: string;
  qr?: string; // URL del QR
  fechaRecepcionDGI?: string;
  nroProtocoloAutorizacion?: string;
  exito: boolean;
  errores?: string[];
}

/**
 * Parse HKA SOAP response handling different structures
 */
export function parseHKAResponse(soapResponse: any): ParsedHKAResponse {
  const result: ParsedHKAResponse = {
    codigo: '',
    resultado: '',
    mensaje: '',
    exito: false,
  };

  try {
    // Try different response structures

    // Structure 1: Direct EnviarResult
    let enviarResult: any = null;

    if (soapResponse.EnviarResult) {
      enviarResult = soapResponse.EnviarResult;
    } else if (soapResponse.EnviarResponse?.EnviarResult) {
      enviarResult = soapResponse.EnviarResponse.EnviarResult;
    } else if (soapResponse.Body?.EnviarResponse?.EnviarResult) {
      enviarResult = soapResponse.Body.EnviarResponse.EnviarResult;
    } else if (soapResponse['soap:Body']?.['EnviarResponse']?.['EnviarResult']) {
      enviarResult = soapResponse['soap:Body']['EnviarResponse']['EnviarResult'];
    } else if (typeof soapResponse === 'string') {
      // If it's a string, try to parse it as XML
      // This is a fallback - ideally we should parse XML properly
      throw new Error('String response not yet supported. Expected parsed object.');
    }

    if (!enviarResult) {
      throw new Error('No se encontró EnviarResult en la respuesta de HKA');
    }

    // Extract fields with multiple possible names
    result.codigo = extractField(enviarResult, ['codigo', 'Codigo', 'a:codigo', 'code']);
    result.resultado = extractField(enviarResult, ['resultado', 'Resultado', 'a:resultado', 'result']);
    result.mensaje = extractField(enviarResult, ['mensaje', 'Mensaje', 'a:mensaje', 'message']);
    
    // Extract identifiers
    result.cufe = extractField(enviarResult, ['cufe', 'Cufe', 'CUFE', 'a:cufe']);
    result.cafe = extractField(enviarResult, ['cafe', 'Cafe', 'CAFE', 'a:cafe']);
    result.numeroDocumentoFiscal = extractField(
      enviarResult,
      ['numeroDocumentoFiscal', 'NumeroDocumentoFiscal', 'numeroDocumento', 'NumeroDocumento', 'a:numeroDocumentoFiscal']
    );

    // Extract files (Base64)
    result.xmlFirmado = extractField(enviarResult, ['xmlFirmado', 'XMLFirmado', 'xmlFirmadoBase64', 'a:xmlFirmado']);
    result.pdfBase64 = extractField(enviarResult, ['pdf', 'PDF', 'pdfBase64', 'PDFBase64', 'a:pdf']);
    result.codigoQrBase64 = extractField(
      enviarResult,
      ['codigoQr', 'CodigoQR', 'codigoQrBase64', 'CodigoQRBase64', 'qrCode', 'a:codigoQr']
    );

    // Extract QR URL (different from QR code image)
    result.qr = extractField(enviarResult, ['qr', 'QR', 'qrUrl', 'QRUrl', 'a:qr']);

    // Extract dates and protocol
    result.fechaRecepcionDGI = extractField(
      enviarResult,
      ['fechaRecepcionDGI', 'FechaRecepcionDGI', 'fechaRecepcion', 'FechaRecepcion', 'a:fechaRecepcionDGI']
    );
    result.nroProtocoloAutorizacion = extractField(
      enviarResult,
      [
        'nroProtocoloAutorizacion',
        'NroProtocoloAutorizacion',
        'protocoloAutorizacion',
        'ProtocoloAutorizacion',
        'protocolo',
        'Protocolo',
        'a:nroProtocoloAutorizacion',
      ]
    );

    // Extract success flag
    const exitoStr = extractField(enviarResult, ['exito', 'Exito', 'a:exito', 'success']);
    result.exito = exitoStr === 'true' || exitoStr === '1' || result.codigo === '200' || result.codigo === '0200';

    // Extract errors if present
    const errores = extractField(enviarResult, ['errores', 'Errores', 'a:errores', 'errors']);
    if (errores) {
      if (Array.isArray(errores)) {
        result.errores = errores;
      } else if (typeof errores === 'string') {
        result.errores = [errores];
      }
    }

    // If no explicit success, determine from code
    if (!result.exito && result.codigo) {
      result.exito = result.codigo === '200' || result.codigo === '0200';
    }

  } catch (error) {
    result.mensaje = `Error parseando respuesta HKA: ${error instanceof Error ? error.message : 'Unknown'}`;
    result.errores = [result.mensaje];
    result.exito = false;
  }

  return result;
}

/**
 * Extract field from object trying multiple possible keys
 */
function extractField(obj: any, possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return String(obj[key]);
    }
  }
  return undefined;
}

/**
 * Validate minimum required fields in HKA response
 */
export function validateMinimumResponse(response: ParsedHKAResponse): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Required fields for successful response
  if (!response.codigo) {
    missingFields.push('codigo');
  }

  if (!response.resultado) {
    missingFields.push('resultado');
  }

  if (!response.mensaje) {
    missingFields.push('mensaje');
  }

  // If success, should have at least CUFE or CAFE
  if (response.exito) {
    if (!response.cufe && !response.cafe) {
      missingFields.push('cufe o cafe');
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Convert parsed response to EnviarDocumentoResponse format
 */
export function toEnviarDocumentoResponse(
  parsed: ParsedHKAResponse
): EnviarDocumentoResponse {
  // Mapear campos parseados a la interfaz EnviarDocumentoResponse
  const erroresMapeados = parsed.errores?.map(err => ({
    Codigo: err.split(':')[0] || 'ERROR',
    Descripcion: err.split(':').slice(1).join(':').trim() || err,
  })) || [];

  return {
    // Campos base de HKABaseResponse
    dCodRes: parsed.codigo || '',
    dMsgRes: parsed.mensaje || '',
    dVerApl: '1.00', // Versión por defecto
    dFecProc: parsed.fechaRecepcionDGI || new Date().toISOString(),
    
    // Campos principales
    dCufe: parsed.cufe,
    dProtocolo: parsed.nroProtocoloAutorizacion,
    dQr: parsed.qr || parsed.codigoQrBase64 || undefined,
    
    // Campos según guía de implementación HKA
    CAFE: parsed.cafe,
    NumeroDocumentoFiscal: parsed.numeroDocumentoFiscal,
    XMLFirmado: parsed.xmlFirmado,
    PDF: parsed.pdfBase64,
    CodigoQR: parsed.codigoQrBase64,
    qr: parsed.qr,
    fechaRecepcionDGI: parsed.fechaRecepcionDGI,
    nroProtocoloAutorizacion: parsed.nroProtocoloAutorizacion,
    Mensaje: parsed.mensaje,
    FechaRecepcion: parsed.fechaRecepcionDGI,
    ProtocoloAutorizacion: parsed.nroProtocoloAutorizacion,
    Exito: parsed.exito,
    Errores: erroresMapeados.length > 0 ? erroresMapeados : undefined,
    
    // Legacy fields
    xContPDF: parsed.pdfBase64,
  };
}

