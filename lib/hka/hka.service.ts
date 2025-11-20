/**
 * HKA Service
 * Servicio principal con los 9 métodos del Web Service HKA
 */

import { HkaClient } from './hka.client';
import { HkaXmlBuilder } from './builders/xml-builder';
import { HkaXmlParser } from './parsers/xml-parser';
import type {
  HkaCredentials,
  EnviarFacturaRequest,
  EnviarFacturaResponse,
  EstadoDocumentoRequest,
  EstadoDocumentoResponse,
  AnulacionDocumentoRequest,
  AnulacionDocumentoResponse,
  DescargaRequest,
  DescargaXMLResponse,
  DescargaPDFResponse,
  FoliosRestantesResponse,
  EnvioCorreoRequest,
  EnvioCorreoResponse,
  RastreoCorreoRequest,
  RastreoCorreoResponse,
  ConsultarRucDVRequest,
  ConsultarRucDVResponse,
} from './types';

export class HkaService {
  private client: HkaClient;
  private credentials: HkaCredentials;

  constructor(credentials: HkaCredentials) {
    this.credentials = credentials;
    this.client = new HkaClient(credentials.environment);
  }

  /**
   * Enviar - Emite una factura electrónica
   */
  async enviar(request: EnviarFacturaRequest): Promise<EnviarFacturaResponse> {
    const xml = HkaXmlBuilder.buildEnvelope('Enviar', this.credentials, request);
    const responseXml = await this.client.execute('Enviar', xml);
    return HkaXmlParser.parseResponse<EnviarFacturaResponse>(responseXml, 'Enviar');
  }

  /**
   * EstadoDocumento - Consulta el estado de un documento
   */
  async estadoDocumento(request: EstadoDocumentoRequest): Promise<EstadoDocumentoResponse> {
    const xml = HkaXmlBuilder.buildEnvelope('EstadoDocumento', this.credentials, request);
    const responseXml = await this.client.execute('EstadoDocumento', xml);
    return HkaXmlParser.parseResponse<EstadoDocumentoResponse>(responseXml, 'EstadoDocumento');
  }

  /**
   * AnulacionDocumento - Anula un documento previamente emitido
   */
  async anulacionDocumento(
    request: AnulacionDocumentoRequest
  ): Promise<AnulacionDocumentoResponse> {
    const xml = HkaXmlBuilder.buildEnvelope('AnulacionDocumento', this.credentials, request);
    const responseXml = await this.client.execute('AnulacionDocumento', xml);
    return HkaXmlParser.parseResponse<AnulacionDocumentoResponse>(
      responseXml,
      'AnulacionDocumento'
    );
  }

  /**
   * DescargaXML - Descarga el XML de un documento
   */
  async descargaXML(request: DescargaRequest): Promise<DescargaXMLResponse> {
    const xml = HkaXmlBuilder.buildEnvelope('DescargaXML', this.credentials, request);
    const responseXml = await this.client.execute('DescargaXML', xml);
    return HkaXmlParser.parseResponse<DescargaXMLResponse>(responseXml, 'DescargaXML');
  }

  /**
   * DescargaPDF - Descarga el PDF de un documento
   */
  async descargaPDF(request: DescargaRequest): Promise<DescargaPDFResponse> {
    const xml = HkaXmlBuilder.buildEnvelope('DescargaPDF', this.credentials, request);
    const responseXml = await this.client.execute('DescargaPDF', xml);
    return HkaXmlParser.parseResponse<DescargaPDFResponse>(responseXml, 'DescargaPDF');
  }

  /**
   * FoliosRestantes - Consulta folios disponibles
   */
  async foliosRestantes(): Promise<FoliosRestantesResponse> {
    const xml = HkaXmlBuilder.buildEnvelope('FoliosRestantes', this.credentials);
    const responseXml = await this.client.execute('FoliosRestantes', xml);
    return HkaXmlParser.parseResponse<FoliosRestantesResponse>(responseXml, 'FoliosRestantes');
  }

  /**
   * EnvioCorreo - Envía factura por correo electrónico
   */
  async envioCorreo(request: EnvioCorreoRequest): Promise<EnvioCorreoResponse> {
    // Convertir array de correos a string si es necesario
    const requestData = {
      ...request,
      correos: Array.isArray(request.correos) ? request.correos.join(',') : request.correos,
    };

    const xml = HkaXmlBuilder.buildEnvelope('EnvioCorreo', this.credentials, requestData);
    const responseXml = await this.client.execute('EnvioCorreo', xml);
    return HkaXmlParser.parseResponse<EnvioCorreoResponse>(responseXml, 'EnvioCorreo');
  }

  /**
   * RastreoCorreo - Rastrea el estado de un envío de correo
   */
  async rastreoCorreo(request: RastreoCorreoRequest): Promise<RastreoCorreoResponse> {
    const xml = HkaXmlBuilder.buildEnvelope('RastreoCorreo', this.credentials, request);
    const responseXml = await this.client.execute('RastreoCorreo', xml);
    return HkaXmlParser.parseResponse<RastreoCorreoResponse>(responseXml, 'RastreoCorreo');
  }

  /**
   * ConsultarRucDV - Consulta el dígito verificador de un RUC
   */
  async consultarRucDV(request: ConsultarRucDVRequest): Promise<ConsultarRucDVResponse> {
    const xml = HkaXmlBuilder.buildEnvelope('ConsultarRucDV', this.credentials, request);
    const responseXml = await this.client.execute('ConsultarRucDV', xml);
    return HkaXmlParser.parseResponse<ConsultarRucDVResponse>(responseXml, 'ConsultarRucDV');
  }

  /**
   * Actualiza las credenciales
   */
  updateCredentials(credentials: HkaCredentials): void {
    this.credentials = credentials;
    this.client = new HkaClient(credentials.environment);
  }

  /**
   * Obtiene el cliente HTTP para configuración avanzada
   */
  getClient(): HkaClient {
    return this.client;
  }
}
