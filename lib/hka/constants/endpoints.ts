/**
 * HKA Endpoints Configuration
 */

export type HKAEnvironment = 'DEMO' | 'PROD';

const ENDPOINTS = {
    DEMO: {
        SOAP: 'https://demows.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
        REST: 'https://demows.thefactoryhka.com.pa/api/v1.0',
    },
    PROD: {
        SOAP: 'https://ws.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
        REST: 'https://ws.thefactoryhka.com.pa/api/v1.0',
    },
} as const;

export function getEndpoint(environment: HKAEnvironment, type: 'SOAP' | 'REST'): string {
    return ENDPOINTS[environment][type];
}
