/**
 * HKA EstadoDocumento Types
 */

import { HkaBaseResponse } from './common.types';

export interface EstadoDocumentoRequest {
  cufe: string; // CUFE del documento a consultar
}

export interface EstadoDocumentoResponse extends HkaBaseResponse {
  estado?: string; // Estado del documento en DGI
  fechaEstado?: string;
  motivoRechazo?: string;
}
