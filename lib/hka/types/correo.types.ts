/**
 * HKA EnvioCorreo y RastreoCorreo Types
 */

import { HkaBaseResponse } from './common.types';

export interface EnvioCorreoRequest {
  cufe: string;
  correos: string[]; // Lista de emails separados por coma o array
  asunto?: string;
  mensaje?: string;
  incluirPDF?: boolean;
  incluirXML?: boolean;
}

export interface EnvioCorreoResponse extends HkaBaseResponse {
  trackingId?: string; // ID para rastreo
  correoEnviado?: boolean;
  destinatarios?: string[];
}

export interface RastreoCorreoRequest {
  trackingId: string; // ID de seguimiento del envío
}

export interface RastreoCorreoResponse extends HkaBaseResponse {
  estadoEnvio?: string; // 'ENVIADO' | 'ENTREGADO' | 'FALLIDO' | 'REBOTADO'
  fechaEnvio?: string;
  fechaEntrega?: string;
  destinatarios?: DestinatarioEstado[];
}

export interface DestinatarioEstado {
  correo: string;
  estado: string;
  fecha?: string;
  error?: string;
}
