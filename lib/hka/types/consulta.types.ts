/**
 * HKA ConsultarRucDV Types
 */

import { HkaBaseResponse } from './common.types';

export interface ConsultarRucDVRequest {
  ruc: string; // RUC sin dígito verificador (ej: '2-737-2342')
}

export interface ConsultarRucDVResponse extends HkaBaseResponse {
  ruc?: string;
  digitoVerificador?: string; // DV calculado
  razonSocial?: string;
  estado?: string; // 'ACTIVO' | 'INACTIVO'
}
