/**
 * HKA XML Parser
 * Parsea respuestas SOAP de HKA usando xml2js
 */

import { parseStringPromise, processors } from 'xml2js';
import { HkaBusinessError } from '../types';
import { HKA_RESPONSE_CODES } from '../constants/catalogs';

export class HkaXmlParser {
  /**
   * Parsea respuesta XML de HKA
   * @param xmlString - XML response de HKA
   * @param methodName - Nombre del método invocado
   * @returns Parsed response object
   */
  static async parseResponse<T>(xmlString: string, methodName: string): Promise<T> {
    try {
      // Parse XML con xml2js
      const parsed = await parseStringPromise(xmlString, {
        explicitArray: false,
        tagNameProcessors: [processors.stripPrefix], // Remover prefijos (s:, tem:, etc)
        ignoreAttrs: false,
        trim: true,
      });

      // Navegar estructura SOAP: Envelope → Body → {Method}Response → {Method}Result
      const envelope = parsed?.Envelope || parsed?.envelope;
      if (!envelope) {
        throw new Error('Invalid SOAP response: No Envelope found');
      }

      const body = envelope.Body || envelope.body;
      if (!body) {
        throw new Error('Invalid SOAP response: No Body found');
      }

      const methodResponse = body[`${methodName}Response`];
      if (!methodResponse) {
        throw new Error(`Invalid SOAP response: No ${methodName}Response found`);
      }

      const methodResult = methodResponse[`${methodName}Result`];
      if (!methodResult) {
        throw new Error(`Invalid SOAP response: No ${methodName}Result found`);
      }

      // Extraer campos base
      const codigo = methodResult.codigo || methodResult.Codigo || '';
      const resultado = methodResult.resultado || methodResult.Resultado || '';
      const mensaje = methodResult.mensaje || methodResult.Mensaje || '';

      // Validar códigos de éxito según Blueprint HKA Panamá
      // Diferentes métodos retornan diferentes códigos de éxito:
      // - '0260' = Recepción de FE autorizada
      // - '0422' = Consulta FE exitosa
      // - '0600' = Evento de anulación registrado
      // - '200'  = FoliosRestantes
      // - '00'   = Legacy
      // - '100'  = Procesamiento en curso
      const successCodes = [
        HKA_RESPONSE_CODES.SUCCESS,           // '00' - legacy
        HKA_RESPONSE_CODES.SUCCESS_200,       // '200' - FoliosRestantes
        HKA_RESPONSE_CODES.FE_AUTORIZADA,     // '0260' - "Autorizado el uso de la FE"
        HKA_RESPONSE_CODES.CONSULTA_EXITOSA,  // '0422' - "Exito en la consulta"
        HKA_RESPONSE_CODES.EVENTO_REGISTRADO, // '0600' - "Evento registrado con éxito"
        HKA_RESPONSE_CODES.PROCESSING,        // '100' - procesamiento en curso
      ];

      if (!successCodes.includes(codigo as any)) {
        throw new HkaBusinessError(codigo, mensaje);
      }

      // Extraer campos adicionales según el método
      const additionalFields = this.extractAdditionalFields(methodResult, methodName);

      // Construir respuesta
      const response = {
        codigo,
        resultado,
        mensaje,
        ...additionalFields,
      };

      return response as T;
    } catch (error) {
      if (error instanceof HkaBusinessError) {
        throw error;
      }

      throw new Error(`XML Parse Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extrae campos adicionales específicos de cada método
   */
  private static extractAdditionalFields(result: any, methodName: string): Record<string, any> {
    const fields: Record<string, any> = {};

    switch (methodName) {
      case 'Enviar':
        if (result.cufe || result.CUFE) fields.cufe = result.cufe || result.CUFE;
        if (result.qr || result.QR) fields.qr = result.qr || result.QR;
        if (result.protocolo || result.Protocolo) fields.protocolo = result.protocolo || result.Protocolo;
        if (result.fechaProtocolo) fields.fechaProtocolo = result.fechaProtocolo;
        if (result.numeroDocumentoFiscal) fields.numeroDocumentoFiscal = result.numeroDocumentoFiscal;
        break;

      case 'FoliosRestantes':
        // Información de licencia
        if (result.licencia || result.Licencia) {
          fields.licencia = result.licencia || result.Licencia;
        }
        if (result.fechaLicencia || result.FechaLicencia) {
          fields.fechaLicencia = result.fechaLicencia || result.FechaLicencia;
        }

        // Información de ciclo
        if (result.ciclo || result.Ciclo) {
          fields.ciclo = result.ciclo || result.Ciclo;
        }
        if (result.fechaCiclo || result.FechaCiclo) {
          fields.fechaCiclo = result.fechaCiclo || result.FechaCiclo;
        }

        // Folios del ciclo actual
        if (result.foliosTotalesCiclo !== undefined || result.FoliosTotalesCiclo !== undefined) {
          fields.foliosTotalesCiclo = parseInt(
            String(result.foliosTotalesCiclo || result.FoliosTotalesCiclo || '0'),
            10
          );
        }
        if (result.foliosUtilizadosCiclo !== undefined || result.FoliosUtilizadosCiclo !== undefined) {
          fields.foliosUtilizadosCiclo = parseInt(
            String(result.foliosUtilizadosCiclo || result.FoliosUtilizadosCiclo || '0'),
            10
          );
        }
        if (result.foliosDisponibleCiclo !== undefined || result.FoliosDisponibleCiclo !== undefined) {
          fields.foliosDisponibleCiclo = parseInt(
            String(result.foliosDisponibleCiclo || result.FoliosDisponibleCiclo || '0'),
            10
          );
        }

        // Folios totales (históricos)
        if (result.foliosTotales !== undefined || result.FoliosTotales !== undefined) {
          fields.foliosTotales = parseInt(
            String(result.foliosTotales || result.FoliosTotales || '0'),
            10
          );
        }
        if (result.foliosTotalesDisponibles !== undefined || result.FoliosTotalesDisponibles !== undefined) {
          fields.foliosTotalesDisponibles = parseInt(
            String(result.foliosTotalesDisponibles || result.FoliosTotalesDisponibles || '0'),
            10
          );
        }

        // Campos legacy (compatibilidad)
        if (result.foliosDisponibles !== undefined || result.FoliosDisponibles !== undefined) {
          fields.foliosDisponibles = parseInt(
            String(result.foliosDisponibles || result.FoliosDisponibles || '0'),
            10
          );
        }
        if (result.foliosUsados !== undefined || result.FoliosUsados !== undefined) {
          fields.foliosUsados = parseInt(
            String(result.foliosUsados || result.FoliosUsados || '0'),
            10
          );
        }
        if (result.ultimoFolioUsado || result.UltimoFolioUsado) {
          fields.ultimoFolioUsado = result.ultimoFolioUsado || result.UltimoFolioUsado;
        }
        if (result.proximoFolio || result.ProximoFolio) {
          fields.proximoFolio = result.proximoFolio || result.ProximoFolio;
        }
        break;

      case 'DescargaXML':
      case 'DescargaPDF':
        if (result.documento || result.Documento) {
          fields.documento = result.documento || result.Documento;
        }
        if (result.nombreArchivo) fields.nombreArchivo = result.nombreArchivo;
        break;

      case 'EstadoDocumento':
        if (result.estado || result.Estado) fields.estado = result.estado || result.Estado;
        if (result.fechaEstado) fields.fechaEstado = result.fechaEstado;
        if (result.motivoRechazo) fields.motivoRechazo = result.motivoRechazo;
        break;

      case 'AnulacionDocumento':
        if (result.cufeAnulacion) fields.cufeAnulacion = result.cufeAnulacion;
        if (result.protocoloAnulacion) fields.protocoloAnulacion = result.protocoloAnulacion;
        if (result.fechaAnulacion) fields.fechaAnulacion = result.fechaAnulacion;
        break;

      case 'EnvioCorreo':
        if (result.trackingId) fields.trackingId = result.trackingId;
        if (result.correoEnviado !== undefined) {
          fields.correoEnviado = result.correoEnviado === 'true' || result.correoEnviado === true;
        }
        if (result.destinatarios) fields.destinatarios = result.destinatarios;
        break;

      case 'RastreoCorreo':
        if (result.estadoEnvio) fields.estadoEnvio = result.estadoEnvio;
        if (result.fechaEnvio) fields.fechaEnvio = result.fechaEnvio;
        if (result.fechaEntrega) fields.fechaEntrega = result.fechaEntrega;
        if (result.destinatarios) fields.destinatarios = result.destinatarios;
        break;

      case 'ConsultarRucDV':
        if (result.ruc || result.RUC) fields.ruc = result.ruc || result.RUC;
        if (result.digitoVerificador || result.DV) {
          fields.digitoVerificador = result.digitoVerificador || result.DV;
        }
        if (result.razonSocial) fields.razonSocial = result.razonSocial;
        if (result.estado) fields.estado = result.estado;
        break;
    }

    return fields;
  }

  /**
   * Extrae mensaje de error de respuesta SOAP Fault
   */
  static extractSoapFault(xmlString: string): string {
    try {
      // Buscar faultstring en el XML
      const faultMatch = xmlString.match(/<faultstring>(.*?)<\/faultstring>/i);
      if (faultMatch && faultMatch[1]) {
        return faultMatch[1];
      }

      const detailMatch = xmlString.match(/<detail>(.*?)<\/detail>/is);
      if (detailMatch && detailMatch[1]) {
        return detailMatch[1].replace(/<[^>]*>/g, '').trim();
      }

      return 'SOAP Fault - Unable to parse error details';
    } catch {
      return 'SOAP Fault - Unknown error';
    }
  }
}
