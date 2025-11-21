/**
 * HKA SOAP Actions and Namespaces
 * Nombres exactos según WSDL de The Factory HKA Panamá
 */

export type HkaMethod =
    | 'Enviar'
    | 'FoliosRestantes'
    | 'DescargaXML'
    | 'DescargaPDF'
    | 'EnvioCorreo'
    | 'RastreoCorreo'
    | 'EstadoDocumento'
    | 'AnulacionDocumento'
    | 'ConsultarRucDV';

const SOAP_ACTIONS: Record<HkaMethod, string> = {
    Enviar: 'http://tempuri.org/IService/Enviar',
    FoliosRestantes: 'http://tempuri.org/IService/FoliosRestantes',
    DescargaXML: 'http://tempuri.org/IService/DescargaXML',
    DescargaPDF: 'http://tempuri.org/IService/DescargaPDF',
    EnvioCorreo: 'http://tempuri.org/IService/EnvioCorreo',
    RastreoCorreo: 'http://tempuri.org/IService/RastreoCorreo',
    EstadoDocumento: 'http://tempuri.org/IService/EstadoDocumento',
    AnulacionDocumento: 'http://tempuri.org/IService/AnulacionDocumento',
    ConsultarRucDV: 'http://tempuri.org/IService/ConsultarRucDV',
};

export function getSoapAction(method: HkaMethod): string {
    return SOAP_ACTIONS[method];
}
