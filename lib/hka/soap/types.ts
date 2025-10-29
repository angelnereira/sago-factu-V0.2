// ============================================
// TIPOS GENERALES
// ============================================

export type HKAEnvironment = 'demo' | 'prod';

export interface HKACredentials {
  tokenEmpresa: string;
  tokenPassword: string;
  usuario: string;
}

export interface HKABaseResponse {
  dCodRes: string;        // Código de respuesta
  dMsgRes: string;        // Mensaje de respuesta
  dVerApl: string;        // Versión de aplicación
  dFecProc: string;       // Fecha de procesamiento
}

// ============================================
// TIPOS PARA RECEPCIÓN DE DOCUMENTOS
// ============================================

export interface EnviarDocumentoParams {
  tokenEmpresa: string;
  tokenPassword: string;
  documento: string;      // XML del documento electrónico
}

export interface EnviarDocumentoResponse extends HKABaseResponse {
  dCufe?: string;         // Código Único de Factura Electrónica
  dProtocolo?: string;    // Número de protocolo
  dQr?: string;           // Código QR
  xContPDF?: string;      // Contenido PDF en Base64
}

// ============================================
// TIPOS PARA CONSULTA DE DOCUMENTOS
// ============================================

export interface ConsultarDocumentoParams {
  dVerForm: string;       // Versión de formulario (1.00)
  dId: string;            // ID del tipo de operación (01)
  iAmb: number;           // Ambiente (1=Prod, 2=Demo)
  dCufe: string;          // CUFE del documento a consultar
}

export interface ConsultarDocumentoResponse extends HKABaseResponse {
  xContenFE?: {
    rContFe: {
      dVerForm: string;
      xFe: string;        // XML del documento
      xContPDF: string;   // PDF en Base64
    }
  };
}

// ============================================
// TIPOS PARA CONSULTA DE FOLIOS
// ============================================

export interface ConsultarFoliosParams {
  tokenEmpresa: string;
  tokenPassword: string;
  ruc: string;            // RUC de la empresa
  dv: string;             // Dígito verificador
}

export interface Folio {
  numeroFolio: string;
  puntoFacturacion: string;
  tipoDocumento: string;
  estado: 'DISPONIBLE' | 'ASIGNADO' | 'UTILIZADO' | 'ANULADO';
  fechaAsignacion?: string;
  cufe?: string;          // Si está utilizado
}

export interface ConsultarFoliosResponse extends HKABaseResponse {
  folios: Folio[];
  totalDisponibles: number;
  totalAsignados: number;
  totalUtilizados: number;
}

// ============================================
// TIPOS PARA ANULACIÓN DE DOCUMENTOS
// ============================================

export interface AnularDocumentoParams {
  tokenEmpresa: string;
  tokenPassword: string;
  dCufe: string;          // CUFE del documento a anular
  motivo: string;         // Motivo de anulación
}

export interface AnularDocumentoResponse extends HKABaseResponse {
  dProtocoloAnulacion?: string;
}

// ============================================
// TIPOS PARA NOTAS DE CRÉDITO
// ============================================

export interface NotaCreditoParams {
  tokenEmpresa: string;
  tokenPassword: string;
  documento: string;      // XML de la nota de crédito
  dCufeReferencia: string; // CUFE de la factura original
}

export interface NotaCreditoResponse extends HKABaseResponse {
  dCufe?: string;
  dProtocolo?: string;
  dQr?: string;
  xContPDF?: string;
}

// ============================================
// TIPOS PARA NOTAS DE DÉBITO
// ============================================

export interface NotaDebitoParams {
  tokenEmpresa: string;
  tokenPassword: string;
  documento: string;      // XML de la nota de débito
  dCufeReferencia: string; // CUFE de la factura original
}

export interface NotaDebitoResponse extends HKABaseResponse {
  dCufe?: string;
  dProtocolo?: string;
  dQr?: string;
  xContPDF?: string;
}

// ============================================
// TIPOS PARA ENVÍO DE CORREO
// ============================================

export interface EnvioCorreoParams {
  CAFE: string; // Código de Autorización de Factura Electrónica (invoice.cufe)
  CorreoDestinatario: string;
  IncluirPDF: boolean;
  IncluirXML: boolean;
  MensajePersonalizado?: string;
  TokenEmpresa: string;
  TokenPassword: string;
}

export interface EnvioCorreoResponse extends HKABaseResponse {
  Exito: boolean;
  CAFE: string;
  CorreoEnviado: string;
  FechaEnvio: string;
  IdRastreo: string;
  Mensaje: string;
}

// ============================================
// TIPOS PARA RASTREO DE CORREO
// ============================================

export interface RastreoCorreoParams {
  IdRastreo: string;
  TokenEmpresa: string;
  TokenPassword: string;
}

export type RastreoCorreoEstado = 'ENVIADO' | 'ENTREGADO' | 'REBOTADO' | 'FALLIDO';

export interface RastreoCorreoResponse extends HKABaseResponse {
  Exito: boolean;
  IdRastreo: string;
  Estado: RastreoCorreoEstado;
  FechaEnvio: string;
  FechaEntrega?: string;
  CorreoDestinatario: string;
}

// ============================================
// CÓDIGOS DE RESPUESTA HKA
// ============================================

export enum HKAResponseCode {
  SUCCESS = '0200',           // Documento procesado exitosamente
  QUERY_SUCCESS = '0422',     // Consulta exitosa
  PENDING = '0201',           // Documento pendiente de procesamiento
  REJECTED = '0400',          // Documento rechazado
  ERROR_FORMAT = '0401',      // Error en formato del documento
  ERROR_VALIDATION = '0402',  // Error en validación
  ERROR_AUTH = '0403',        // Error de autenticación
  ERROR_RUC = '0404',         // RUC no encontrado
  ERROR_FOLIO = '0405',       // Folio no disponible
  ERROR_DUPLICATED = '0406',  // Documento duplicado
  ERROR_SERVER = '0500',      // Error interno del servidor
}

export function isSuccessResponse(code: string): boolean {
  return code === HKAResponseCode.SUCCESS || code === HKAResponseCode.QUERY_SUCCESS;
}

