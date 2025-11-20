/**
 * HKA Descarga Types (XML y PDF)
 */

import { HkaBaseResponse } from './common.types';

export interface DescargaRequest {
  cufe: string; // CUFE del documento
}

export interface DescargaXMLResponse extends HkaBaseResponse {
  documento?: string; // XML en Base64
  nombreArchivo?: string;
}

export interface DescargaPDFResponse extends HkaBaseResponse {
  documento?: string; // PDF en Base64
  nombreArchivo?: string;
}
