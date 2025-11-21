/**
 * HKA Endpoints Configuration
 */

export type HKAEnvironment = 'DEMO' | 'PROD';

const ENDPOINTS = {
    DEMO: {
        SOAP: 'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
        REST: 'https://demoemision.thefactoryhka.com.pa/api/v1.0',
    },
    PROD: {
        SOAP: 'https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
        REST: 'https://emision.thefactoryhka.com.pa/api/v1.0',
    },
} as const;

export function getEndpoint(environment: HKAEnvironment, type: 'SOAP' | 'REST'): string {
    return ENDPOINTS[environment][type];
}
