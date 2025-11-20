/**
 * SOAP Namespaces para HKA Web Service
 * Crítico: Enviar usa SER_COMPROBANTE, ConsultarRucDV usa SER_APIREST, resto usa SER_MODEL
 */

export const SOAP_NAMESPACES = {
  SOAP_ENV: 'http://schemas.xmlsoap.org/soap/envelope/',
  TEMPURI: 'http://tempuri.org/',
  SER_COMPROBANTE: 'http://schemas.datacontract.org/2004/07/Services.ObjComprobante.v1_0',
  SER_MODEL: 'http://schemas.datacontract.org/2004/07/Services.Model',
  SER_APIREST: 'http://schemas.datacontract.org/2004/07/Services.ApiRest',
} as const;

export type HkaMethod =
  | 'Enviar'
  | 'EstadoDocumento'
  | 'AnulacionDocumento'
  | 'DescargaXML'
  | 'FoliosRestantes'
  | 'EnvioCorreo'
  | 'DescargaPDF'
  | 'RastreoCorreo'
  | 'ConsultarRucDV';

/**
 * Mapeo de métodos a sus namespaces específicos
 * CRÍTICO: Este mapeo determina qué namespace 'ser:' usar en el XML
 */
export const METHOD_NAMESPACE_MAP: Record<HkaMethod, string> = {
  Enviar: SOAP_NAMESPACES.SER_COMPROBANTE,
  ConsultarRucDV: SOAP_NAMESPACES.SER_APIREST,
  EstadoDocumento: SOAP_NAMESPACES.SER_MODEL,
  AnulacionDocumento: SOAP_NAMESPACES.SER_MODEL,
  DescargaXML: SOAP_NAMESPACES.SER_MODEL,
  FoliosRestantes: SOAP_NAMESPACES.SER_MODEL,
  EnvioCorreo: SOAP_NAMESPACES.SER_MODEL,
  DescargaPDF: SOAP_NAMESPACES.SER_MODEL,
  RastreoCorreo: SOAP_NAMESPACES.SER_MODEL,
};

export function getMethodNamespace(method: HkaMethod): string {
  return METHOD_NAMESPACE_MAP[method];
}
