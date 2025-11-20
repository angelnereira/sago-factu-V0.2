/**
 * HKA AnulacionDocumento Types
 */

import { HkaBaseResponse } from './common.types';

export interface AnulacionDocumentoRequest {
  cufe: string; // CUFE del documento a anular
  motivoAnulacion: string; // AN500 - Razón de la anulación
}

export interface AnulacionDocumentoResponse extends HkaBaseResponse {
  cufeAnulacion?: string; // CUFE del documento de anulación
  protocoloAnulacion?: string;
  fechaAnulacion?: string;
}
