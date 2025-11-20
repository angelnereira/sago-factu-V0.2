/**
 * HKA HTTP/SOAP Client
 * Maneja comunicación HTTP con el servicio HKA
 */

import axios, { AxiosError } from 'axios';
import type { HkaMethod } from './constants/namespaces';
import { getSoapAction } from './constants/soap-actions';
import { getEndpoint, type HKAEnvironment } from './constants/endpoints';
import { HkaHttpError, HkaTimeoutError, HkaConnectionError } from './types';
import { HkaXmlParser } from './parsers/xml-parser';

export class HkaClient {
  private baseUrl: string;
  private timeout: number;
  private environment: HKAEnvironment;

  constructor(environment: HKAEnvironment, timeout: number = 30000) {
    this.environment = environment;
    this.baseUrl = getEndpoint(environment, 'SOAP');
    this.timeout = timeout;
  }

  /**
   * Ejecuta llamada SOAP a HKA
   * @param method - Método HKA
   * @param soapXml - XML SOAP completo
   * @returns XML response string
   */
  async execute(method: HkaMethod, soapXml: string): Promise<string> {
    try {
      const soapAction = getSoapAction(method);

      const response = await axios.post(this.baseUrl, soapXml, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': soapAction,
        },
        timeout: this.timeout,
        validateStatus: () => true, // No throw en status !== 2xx
      });

      // Si status !== 200, es error HTTP
      if (response.status !== 200) {
        // Intentar extraer SOAP Fault si existe
        const faultMessage = HkaXmlParser.extractSoapFault(response.data);
        throw new HkaHttpError(
          response.status,
          faultMessage || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return response.data;
    } catch (error) {
      // Re-throw custom errors
      if (
        error instanceof HkaHttpError ||
        error instanceof HkaTimeoutError ||
        error instanceof HkaConnectionError
      ) {
        throw error;
      }

      // Handle axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNABORTED') {
          throw new HkaTimeoutError(`Request timeout after ${this.timeout}ms`);
        }

        if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
          throw new HkaConnectionError(
            `Cannot connect to HKA service: ${axiosError.message}`
          );
        }

        throw new HkaConnectionError(
          `Network error: ${axiosError.message}`
        );
      }

      // Unknown error
      throw new Error(
        `HKA Client Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Actualiza el timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  /**
   * Obtiene el endpoint actual
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Obtiene el environment actual
   */
  getEnvironment(): HKAEnvironment {
    return this.environment;
  }
}
