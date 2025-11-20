/**
 * HKA FoliosRestantes Types
 */

import { HkaBaseResponse } from './common.types';

export interface FoliosRestantesResponse extends HkaBaseResponse {
  foliosDisponibles?: number;
  foliosUsados?: number;
  foliosTotales?: number;
  ultimoFolioUsado?: string;
  proximoFolio?: string;
}
