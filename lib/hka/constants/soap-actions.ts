/**
 * SOAP Actions para headers HTTP
 * Formato: http://tempuri.org/IService/{MethodName}
 * IMPORTANTE: Deben incluirse con comillas dobles en el header
 */

import { HkaMethod } from './namespaces';

export const SOAP_ACTIONS: Record<HkaMethod, string> = {
  Enviar: 'http://tempuri.org/IService/Enviar',
  EstadoDocumento: 'http://tempuri.org/IService/EstadoDocumento',
  AnulacionDocumento: 'http://tempuri.org/IService/AnulacionDocumento',
  DescargaXML: 'http://tempuri.org/IService/DescargaXML',
  FoliosRestantes: 'http://tempuri.org/IService/FoliosRestantes',
  EnvioCorreo: 'http://tempuri.org/IService/EnvioCorreo',
  DescargaPDF: 'http://tempuri.org/IService/DescargaPDF',
  RastreoCorreo: 'http://tempuri.org/IService/RastreoCorreo',
  ConsultarRucDV: 'http://tempuri.org/IService/ConsultarRucDV',
};

export function getSoapAction(method: HkaMethod): string {
  return `"${SOAP_ACTIONS[method]}"`;
}
