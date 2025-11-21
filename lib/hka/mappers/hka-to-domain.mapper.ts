/**
 * HKA to Domain Mapper
 * Convierte respuestas HKA a modelos de dominio
 */

import type {
  EnviarFacturaResponse,
  EstadoDocumentoResponse,
  AnulacionDocumentoResponse,
  DescargaXMLResponse,
  DescargaPDFResponse,
  RastreoCorreoResponse,
  FoliosRestantesResponse,
  ConsultarRucDVResponse,
} from '../types';
import { parseHkaDateTime } from '../utils/date.utils';
import { base64ToBuffer, fromBase64 } from '../utils/encoding.utils';
import { HKA_RESPONSE_CODES } from '../constants/catalogs';

/**
 * Tipos de salida para integración con dominio
 */
export interface EmissionResult {
  success: boolean;
  cufe: string; // Código único de factura electrónica
  protocoloSeguridad: string;
  qrCode: string;
  numeroDocumento: string;
  fechaEmision: Date;
  pdfBase64?: string;
  xmlBase64?: string;
  mensaje?: string;
}

export interface DocumentStatus {
  cufe: string;
  estado: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'ANULADO';
  fechaRecepcion?: Date;
  mensajeEstado: string;
  codigoEstado: string;
}

export interface CancellationResult {
  success: boolean;
  cufe: string;
  fechaAnulacion: Date;
  mensaje: string;
}

export interface DownloadResult {
  cufe: string;
  contentBase64: string;
  contentBuffer: Buffer;
  filename: string;
}

export interface EmailStatus {
  success: boolean;
  cufe: string;
  correos: string[];
  estado: 'ENVIADO' | 'PENDIENTE' | 'ERROR';
  mensaje: string;
}

export interface FolioBalance {
  disponibles: number;
  utilizados: number;
  total: number;
  porcentajeUso: number;
  alertaBajo: boolean;
}

export interface RucValidation {
  valid: boolean;
  ruc: string;
  dv: string;
  dvCalculado: string;
  mensaje?: string;
}

/**
 * Mapper principal
 */
export class HkaToDomainMapper {
  /**
   * Mapea respuesta de Enviar a EmissionResult
   */
  static mapEnviarResponse(response: EnviarFacturaResponse): EmissionResult {
    const success = response.codigo === HKA_RESPONSE_CODES.SUCCESS;

    if (!success) {
      return {
        success: false,
        cufe: '',
        protocoloSeguridad: '',
        qrCode: '',
        numeroDocumento: '',
        fechaEmision: new Date(),
        mensaje: response.mensaje,
      };
    }

    return {
      success: true,
      cufe: response.codigoGeneracion || '',
      protocoloSeguridad: response.protocoloSeguridad || '',
      qrCode: response.qrCode || '',
      numeroDocumento: response.numeroDocumento || '',
      fechaEmision: response.fechaEmision ? parseHkaDateTime(response.fechaEmision) : new Date(),
      pdfBase64: response.pdfBase64,
      xmlBase64: response.archivoXML,
      mensaje: response.mensaje,
    };
  }

  /**
   * Mapea respuesta de EstadoDocumento a DocumentStatus
   */
  static mapEstadoDocumentoResponse(response: EstadoDocumentoResponse): DocumentStatus {
    const estado = this.parseEstadoDocumento(response.resultado || response.mensaje);

    return {
      cufe: response.codigoGeneracion || '',
      estado,
      fechaRecepcion: response.fechaRecepcion
        ? parseHkaDateTime(response.fechaRecepcion)
        : undefined,
      mensajeEstado: response.mensaje,
      codigoEstado: response.codigo,
    };
  }

  /**
   * Mapea respuesta de AnulacionDocumento a CancellationResult
   */
  static mapAnulacionResponse(response: AnulacionDocumentoResponse): CancellationResult {
    const success = response.codigo === HKA_RESPONSE_CODES.SUCCESS;

    return {
      success,
      cufe: response.codigoGeneracion || '',
      fechaAnulacion: new Date(),
      mensaje: response.mensaje,
    };
  }

  /**
   * Mapea respuesta de DescargaXML a DownloadResult
   */
  static mapDescargaXMLResponse(response: DescargaXMLResponse, cufe: string): DownloadResult {
    const contentBase64 = response.archivoXML || '';
    const contentBuffer = base64ToBuffer(contentBase64);

    return {
      cufe,
      contentBase64,
      contentBuffer,
      filename: `${cufe}.xml`,
    };
  }

  /**
   * Mapea respuesta de DescargaPDF a DownloadResult
   */
  static mapDescargaPDFResponse(response: DescargaPDFResponse, cufe: string): DownloadResult {
    const contentBase64 = response.archivoPDF || '';
    const contentBuffer = base64ToBuffer(contentBase64);

    return {
      cufe,
      contentBase64,
      contentBuffer,
      filename: `${cufe}.pdf`,
    };
  }

  /**
   * Mapea respuesta de RastreoCorreo a EmailStatus
   */
  static mapRastreoCorreoResponse(response: RastreoCorreoResponse): EmailStatus {
    const estado = this.parseEstadoCorreo(response.resultado || response.mensaje);
    const success = response.codigo === HKA_RESPONSE_CODES.SUCCESS;

    return {
      success,
      cufe: response.codigoGeneracion || '',
      correos: response.correos ? response.correos.split(',').map(e => e.trim()) : [],
      estado,
      mensaje: response.mensaje,
    };
  }

  /**
   * Mapea respuesta de FoliosRestantes a FolioBalance
   */
  static mapFoliosRestantesResponse(response: FoliosRestantesResponse): FolioBalance {
    // Usar nombres nuevos con fallback a legacy
    const disponibles = response.foliosTotalesDisponibles ??
                       response.foliosDisponibles ??
                       0;

    const utilizados = response.foliosUtilizadosCiclo ??
                      response.foliosUsados ??
                      0;

    const total = response.foliosTotales ??
                 (disponibles + utilizados);

    const porcentajeUso = total > 0 ? (utilizados / total) * 100 : 0;
    const alertaBajo = disponibles < 100; // Alerta si quedan menos de 100

    return {
      disponibles,
      utilizados,
      total,
      porcentajeUso,
      alertaBajo,
    };
  }

  /**
   * Mapea respuesta de ConsultarRucDV a RucValidation
   */
  static mapConsultarRucDVResponse(
    response: ConsultarRucDVResponse,
    rucConsultado: string
  ): RucValidation {
    const dvCalculado = response.digitoVerificador || '';
    const dvProporcionado = rucConsultado.split('-').pop() || '';
    const valid = dvCalculado === dvProporcionado;

    return {
      valid,
      ruc: rucConsultado,
      dv: dvProporcionado,
      dvCalculado,
      mensaje: valid ? 'RUC válido' : 'Dígito verificador incorrecto',
    };
  }

  // ==================== Helpers de Parsing ====================

  /**
   * Parsea estado del documento desde mensaje HKA
   */
  private static parseEstadoDocumento(
    mensaje: string
  ): 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'ANULADO' {
    const mensajeLower = mensaje.toLowerCase();

    if (mensajeLower.includes('aceptado') || mensajeLower.includes('exitoso')) {
      return 'ACEPTADO';
    }
    if (mensajeLower.includes('rechazado') || mensajeLower.includes('error')) {
      return 'RECHAZADO';
    }
    if (mensajeLower.includes('anulado') || mensajeLower.includes('cancelado')) {
      return 'ANULADO';
    }

    return 'PENDIENTE';
  }

  /**
   * Parsea estado de envío de correo
   */
  private static parseEstadoCorreo(mensaje: string): 'ENVIADO' | 'PENDIENTE' | 'ERROR' {
    const mensajeLower = mensaje.toLowerCase();

    if (mensajeLower.includes('enviado') || mensajeLower.includes('exitoso')) {
      return 'ENVIADO';
    }
    if (mensajeLower.includes('error') || mensajeLower.includes('fall')) {
      return 'ERROR';
    }

    return 'PENDIENTE';
  }

  /**
   * Extrae información de QR Code
   */
  static parseQRCode(qrCode: string): {
    cufe: string;
    url: string;
    raw: string;
  } | null {
    if (!qrCode) return null;

    try {
      // QR típicamente contiene: https://verificacion.thefactoryhka.com.pa/?cufe=XXXXX
      const url = qrCode.includes('http') ? qrCode : '';
      const cufeMatch = qrCode.match(/cufe=([A-Za-z0-9-]+)/);
      const cufe = cufeMatch ? cufeMatch[1] : '';

      return {
        cufe,
        url,
        raw: qrCode,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrae metadata de archivo Base64
   */
  static getFileMetadata(base64Content: string, type: 'xml' | 'pdf'): {
    size: number;
    sizeKB: number;
    sizeMB: number;
    type: string;
    extension: string;
  } {
    const buffer = base64ToBuffer(base64Content);
    const size = buffer.length;
    const sizeKB = size / 1024;
    const sizeMB = sizeKB / 1024;

    return {
      size,
      sizeKB: parseFloat(sizeKB.toFixed(2)),
      sizeMB: parseFloat(sizeMB.toFixed(2)),
      type: type === 'xml' ? 'application/xml' : 'application/pdf',
      extension: type,
    };
  }

  /**
   * Valida CUFE (Código Único de Factura Electrónica)
   * Formato típico: UUID o formato HKA específico
   */
  static validateCUFE(cufe: string): boolean {
    if (!cufe || cufe.trim().length === 0) {
      return false;
    }

    // CUFE debe tener al menos 20 caracteres
    if (cufe.length < 20) {
      return false;
    }

    // Validación básica de formato (alfanumérico con guiones)
    const cufePattern = /^[A-Za-z0-9-]+$/;
    return cufePattern.test(cufe);
  }

  /**
   * Formatea fecha de emisión para display
   */
  static formatEmissionDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Panama',
    }).format(date);
  }

  /**
   * Genera resumen de emisión para logs/display
   */
  static generateEmissionSummary(result: EmissionResult): string {
    if (!result.success) {
      return `Emisión fallida: ${result.mensaje}`;
    }

    return [
      `✓ Factura emitida exitosamente`,
      `  CUFE: ${result.cufe}`,
      `  Número: ${result.numeroDocumento}`,
      `  Fecha: ${this.formatEmissionDate(result.fechaEmision)}`,
      result.qrCode ? `  QR disponible` : '',
      result.pdfBase64 ? `  PDF disponible` : '',
      result.xmlBase64 ? `  XML disponible` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Genera resumen de balance de folios
   */
  static generateFolioSummary(balance: FolioBalance): string {
    const emoji = balance.alertaBajo ? '⚠️' : '✓';
    const warning = balance.alertaBajo ? ' - ¡ALERTA: Folios bajos!' : '';

    return [
      `${emoji} Balance de Folios${warning}`,
      `  Disponibles: ${balance.disponibles}`,
      `  Utilizados: ${balance.utilizados}`,
      `  Total: ${balance.total}`,
      `  Uso: ${balance.porcentajeUso.toFixed(1)}%`,
    ].join('\n');
  }

  /**
   * Extrae número de documento del CUFE (si aplicable)
   */
  static extractDocumentNumberFromCUFE(cufe: string): string | null {
    // Implementación específica según formato CUFE de HKA
    // Por ahora retorna los últimos 8 caracteres
    if (!cufe || cufe.length < 8) return null;
    return cufe.slice(-8);
  }

  /**
   * Determina si un código de respuesta indica éxito
   * Basado en Blueprint HKA Panamá
   */
  static isSuccessCode(codigo: string): boolean {
    const successCodes = [
      HKA_RESPONSE_CODES.SUCCESS,           // '00'
      HKA_RESPONSE_CODES.SUCCESS_200,       // '200'
      HKA_RESPONSE_CODES.FE_AUTORIZADA,     // '0260'
      HKA_RESPONSE_CODES.CONSULTA_EXITOSA,  // '0422'
      HKA_RESPONSE_CODES.EVENTO_REGISTRADO, // '0600'
      HKA_RESPONSE_CODES.PROCESSING,        // '100'
    ];
    return successCodes.includes(codigo as any);
  }

  /**
   * Determina si un código de respuesta indica error
   */
  static isErrorCode(codigo: string): boolean {
    return !this.isSuccessCode(codigo);
  }

  /**
   * Obtiene mensaje amigable según código (éxito o error)
   */
  static getFriendlyErrorMessage(codigo: string, mensaje: string): string {
    const messages: Record<string, string> = {
      // Códigos de éxito (según Blueprint HKA)
      '0260': '✅ Factura electrónica autorizada exitosamente',
      '0422': '✅ Consulta de factura electrónica exitosa',
      '0600': '✅ Evento de anulación registrado con éxito',
      '200': '✅ Consulta exitosa',
      '00': '✅ Operación exitosa',
      '100': '⏳ Procesamiento en curso',

      // Códigos de error
      '300': 'Error de autenticación. Verifica tus credenciales HKA.',
      '301': 'Token inválido o expirado.',
      '400': 'Error en los datos enviados. Verifica la información.',
      '401': 'RUC o dígito verificador inválido.',
      '500': 'Error interno del servidor HKA. Intenta más tarde.',
      '503': 'Servicio HKA temporalmente no disponible.',
    };

    return messages[codigo] || mensaje || 'Error desconocido';
  }
}
