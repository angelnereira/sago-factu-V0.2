/**
 * HKA SOAP Actions and Namespaces
 */

export type HkaMethod =
    | 'Enviar'
    | 'Anulacion'
    | 'Consulta'
    | 'Descarga'
    | 'Estado'
    | 'Folios'
    | 'Correo'
    | 'CorreoEvento';

const SOAP_ACTIONS: Record<HkaMethod, string> = {
    Enviar: 'http://tempuri.org/IService/Enviar',
    Anulacion: 'http://tempuri.org/IService/Anulacion',
    Consulta: 'http://tempuri.org/IService/Consulta',
    Descarga: 'http://tempuri.org/IService/Descarga',
    Estado: 'http://tempuri.org/IService/Estado',
    Folios: 'http://tempuri.org/IService/Folios',
    Correo: 'http://tempuri.org/IService/Correo',
    CorreoEvento: 'http://tempuri.org/IService/CorreoEvento',
};

export function getSoapAction(method: HkaMethod): string {
    return SOAP_ACTIONS[method];
}
