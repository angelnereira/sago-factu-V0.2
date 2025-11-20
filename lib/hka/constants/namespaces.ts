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
    | 'CorreoEvento'
    | 'EstadoDocumento'
    | 'AnulacionDocumento'
    | 'DescargaXML'
    | 'DescargaPDF'
    | 'RastreoCorreo'
    | 'ConsultarRucDV'
    | 'EnvioCorreo'
    | 'FoliosRestantes';

export const NAMESPACES = {
    SOAP_ENV: 'http://schemas.xmlsoap.org/soap/envelope/',
    TEMPURI: 'http://tempuri.org/',
} as const;

// Alias para compatibilidad
export const SOAP_NAMESPACES = NAMESPACES;

/**
 * Obtiene el namespace ser: según el método HKA
 */
export function getMethodNamespace(method: HkaMethod): string {
    // Todos los métodos usan el mismo namespace por ahora
    return 'http://schemas.datacontract.org/2004/07/';
}
