/**
 * HKA XML Builder
 * Construye SOAP Envelopes con lógica de prefijos tem:/ser:
 */

import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { HkaMethod, SOAP_NAMESPACES, getMethodNamespace } from '../constants/namespaces';
import type { HkaCredentials } from '../types';

export class HkaXmlBuilder {
  /**
   * Construye el SOAP Envelope completo
   * @param method - Método HKA a invocar
   * @param credentials - Credenciales del usuario
   * @param bodyData - Datos específicos del método (opcional)
   * @returns XML string
   */
  static buildEnvelope(
    method: HkaMethod,
    credentials: HkaCredentials,
    bodyData?: any
  ): string {
    // Determinar namespace ser: según el método
    const serNamespace = getMethodNamespace(method);

    // Crear root con namespaces
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('soapenv:Envelope', {
        'xmlns:soapenv': SOAP_NAMESPACES.SOAP_ENV,
        'xmlns:tem': SOAP_NAMESPACES.TEMPURI,
        'xmlns:ser': serNamespace,
      })
      .ele('soapenv:Header').up()
      .ele('soapenv:Body')
      .ele(`tem:${method}`);

    // Agregar credenciales (siempre tem: prefix)
    root.ele('tem:tokenEmpresa').txt(credentials.tokenEmpresa).up();
    root.ele('tem:tokenPassword').txt(credentials.tokenPassword).up();

    // Si hay body data, agregarlo
    if (bodyData) {
      this.buildBody(root, method, bodyData);
    }

    // Cerrar y generar XML
    return root.end({ prettyPrint: false });
  }

  /**
   * Construye el body específico del método
   */
  private static buildBody(
    parent: XMLBuilder,
    method: HkaMethod,
    data: any
  ): void {
    // Determinar si usa wrapper y su nombre
    const wrapper = this.getBodyWrapper(method);

    if (wrapper) {
      const wrapperNode = parent.ele(`tem:${wrapper}`);
      this.buildRecursive(wrapperNode, data);
    } else {
      this.buildRecursive(parent, data);
    }
  }

  /**
   * Construye XML recursivamente con lógica de prefijos
   */
  private static buildRecursive(
    parent: XMLBuilder,
    data: any,
    forcePrefix?: 'tem' | 'ser'
  ): void {
    if (!data || typeof data !== 'object') return;

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;

      // Determinar prefijo
      const prefix = forcePrefix || this.getPrefix(key);
      const elementName = `${prefix}:${key}`;

      if (Array.isArray(value)) {
        // Arrays: crear elementos múltiples con el mismo nombre
        value.forEach((item) => {
          if (typeof item === 'object') {
            const arrayNode = parent.ele(elementName);
            this.buildRecursive(arrayNode, item, 'ser');
          } else {
            parent.ele(elementName).txt(String(item)).up();
          }
        });
      } else if (typeof value === 'object') {
        // Objetos: crear nodo y recursión
        const childNode = parent.ele(elementName);
        this.buildRecursive(childNode, value, 'ser');
      } else {
        // Primitivos: crear nodo con texto
        const textValue = String(value);

        // Si es informacionInteres, usar CDATA
        if (key === 'informacionInteres' && textValue) {
          parent.ele(elementName).dat(textValue).up();
        } else {
          parent.ele(elementName).txt(textValue).up();
        }
      }
    }
  }

  /**
   * Determina el prefijo (tem: o ser:) según el nombre del elemento
   */
  private static getPrefix(elementName: string): 'tem' | 'ser' {
    // Elementos que siempre usan tem:
    const temElements = [
      'tokenEmpresa',
      'tokenPassword',
      'documento',
      'datosDocumento',
      'motivoAnulacion',
      'cufe',
      'trackingId',
      'ruc',
      'correos',
      'asunto',
      'mensaje',
      'incluirPDF',
      'incluirXML',
    ];

    if (temElements.includes(elementName)) {
      return 'tem';
    }

    // El resto usa ser:
    return 'ser';
  }

  /**
   * Determina el nombre del wrapper según el método
   */
  private static getBodyWrapper(method: HkaMethod): string | null {
    switch (method) {
      case 'Enviar':
        return 'documento';
      case 'EstadoDocumento':
      case 'AnulacionDocumento':
      case 'DescargaXML':
      case 'DescargaPDF':
      case 'RastreoCorreo':
      case 'ConsultarRucDV':
      case 'EnvioCorreo':
        return 'datosDocumento';
      case 'FoliosRestantes':
        return null; // No usa wrapper
      default:
        return null;
    }
  }
}
