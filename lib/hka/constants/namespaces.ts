/**
 * HKA Namespaces
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

export const NAMESPACES = {
    SOAP_ENV: 'http://schemas.xmlsoap.org/soap/envelope/',
    TEMPURI: 'http://tempuri.org/',
} as const;
