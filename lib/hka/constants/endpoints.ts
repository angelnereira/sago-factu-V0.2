/**
 * HKA Endpoints Configuration
 */

export type HKAEnvironment = 'DEMO' | 'PROD';

export const ENDPOINTS = {
    DEMO: {
        SOAP: 'http://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl',
        // REST: 'http://demoemision.thefactoryhka.com.pa/api/v1.0', // Reservado para futuro
    },
    PROD: {
        SOAP: 'http://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl',
        // REST: 'http://emision.thefactoryhka.com.pa/api/v1.0', // Reservado para futuro
    },
} as const;

export function getEndpoint(environment: HKAEnvironment, type: 'SOAP'): string {
    return ENDPOINTS[environment][type];
}
