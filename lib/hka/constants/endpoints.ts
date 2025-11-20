/**
 * HKA Web Service Endpoints
 * The Factory HKA - Panamá
 */

export const HKA_ENDPOINTS = {
  DEMO: {
    SOAP: 'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
    REST: 'https://demointegracion.thefactoryhka.com.pa',
  },
  PROD: {
    SOAP: 'https://ws01.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
    REST: 'https://integracion.thefactoryhka.com.pa',
  },
} as const;

export type HKAEnvironment = 'DEMO' | 'PROD';

export function getEndpoint(environment: HKAEnvironment, type: 'SOAP' | 'REST'): string {
  return HKA_ENDPOINTS[environment][type];
}
