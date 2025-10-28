import { getHKAClient } from '../soap/client';
import { EnviarDocumentoParams, EnviarDocumentoResponse } from '../soap/types';
import { prisma } from '@/lib/db';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';
import { hkaTestModeWrapper } from '../utils/test-mode';
import { validarRUCCompleto, generarRUCPrueba } from '../utils/ruc-validator';

/**
 * Envía un documento electrónico a HKA (Factura, Nota Crédito, Nota Débito)
 */
export async function enviarDocumento(
  xmlDocumento: string,
  invoiceId: string
): Promise<EnviarDocumentoResponse> {
  try {
    console.log(`📤 Enviando documento a HKA para invoice: ${invoiceId}`);

    // Validar RUC en el XML antes de enviar
    const rucValidation = await validarRUCEnXML(xmlDocumento);
    if (!rucValidation.isValid) {
      console.warn(`⚠️ RUC inválido detectado: ${rucValidation.errors.join(', ')}`);
      
      // Si está en modo de prueba, usar RUC de prueba
      if (hkaTestModeWrapper.isTestMode()) {
        console.log(`🧪 [TEST MODE] Usando RUC de prueba válido`);
        xmlDocumento = await corregirRUCEnXML(xmlDocumento);
      }
    }

    // Usar wrapper de modo de prueba
    const response = await hkaTestModeWrapper.enviarDocumento(
      xmlDocumento,
      invoiceId,
      async () => {
        // Método real de envío
        const hkaClient = getHKAClient();
        const credentials = hkaClient.getCredentials();

        // HKA espera el XML como texto plano sin escapar
        // Remover la declaración XML del inicio si existe
        let xmlLimpio = xmlDocumento.trim();
        if (xmlLimpio.startsWith('<?xml')) {
          // Encontrar el final de la declaración XML
          const endOfDeclaration = xmlLimpio.indexOf('?>');
          if (endOfDeclaration !== -1) {
            xmlLimpio = xmlLimpio.substring(endOfDeclaration + 2).trim();
          }
        }

        // Parámetros para envío
        const params: EnviarDocumentoParams = {
          tokenEmpresa: credentials.tokenEmpresa,
          tokenPassword: credentials.tokenPassword,
          documento: xmlLimpio, // Enviar sin declaración XML
        };

        // Invocar método SOAP "Enviar" con monitoreo
        return await monitorHKACall('Enviar', async () => {
          return await hkaClient.invoke<EnviarDocumentoResponse>('Enviar', params);
        });
      }
    );

    console.log(`✅ Documento enviado exitosamente`);
    console.log(`   CUFE: ${response.dCufe}`);
    console.log(`   Protocolo: ${response.dProtocolo}`);
    console.log(`   Código: ${response.dCodRes}`);
    console.log(`   Mensaje: ${response.dMsgRes}`);

    // Actualizar en base de datos con Prisma
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        cufe: response.dCufe,
        // hkaProtocol: response.dProtocolo, // TODO: Agregar campo al schema
        qrCode: response.dQr,
        // pdfBase64: response.xContPDF, // TODO: Agregar campo al schema
        // hkaResponseCode: response.dCodRes, // TODO: Agregar campo al schema
        // hkaResponseMessage: response.dMsgRes, // TODO: Agregar campo al schema
        status: response.dCodRes === '0200' ? 'CERTIFIED' : 'REJECTED',
        certifiedAt: response.dCodRes === '0200' ? new Date() : null,
      },
    });

    return response;
  } catch (error) {
    console.error('❌ Error al enviar documento:', error);
    
    // Actualizar error en base de datos
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'REJECTED',
        // hkaResponseMessage: error instanceof Error ? error.message : 'Unknown error', // TODO: Agregar campo al schema
      },
    });

    throw error;
  }
}

/**
 * Valida el RUC en el XML del documento
 */
async function validarRUCEnXML(xmlDocumento: string): Promise<{
  isValid: boolean;
  errors: string[];
  rucEncontrado?: string;
}> {
  try {
    // Extraer RUC del XML usando regex
    const rucMatch = xmlDocumento.match(/<dRuc>([^<]+)<\/dRuc>/);
    const dvMatch = xmlDocumento.match(/<dDV>([^<]+)<\/dDV>/);
    
    if (!rucMatch || !dvMatch) {
      return {
        isValid: false,
        errors: ['No se pudo extraer RUC o DV del XML']
      };
    }
    
    const ruc = rucMatch[1];
    const dv = dvMatch[1];
    const rucCompleto = `${ruc}-${dv}`;
    
    // Validar formato completo del RUC
    const validation = validarRUCCompleto(rucCompleto);
    
    return {
      isValid: validation.isValid,
      errors: validation.errors,
      rucEncontrado: rucCompleto
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Error al validar RUC en XML: ${error instanceof Error ? error.message : 'Error desconocido'}`]
    };
  }
}

/**
 * Corrige el RUC en el XML usando un RUC de prueba válido
 */
async function corregirRUCEnXML(xmlDocumento: string): Promise<string> {
  try {
    const rucPrueba = generarRUCPrueba();
    const partes = rucPrueba.split('-');
    const [ruc, tipoRuc, año, dv] = partes;
    
    // Reemplazar RUC en el XML
    let xmlCorregido = xmlDocumento.replace(
      /<dRuc>[^<]+<\/dRuc>/,
      `<dRuc>${ruc}</dRuc>`
    );
    
    // Reemplazar DV en el XML
    xmlCorregido = xmlCorregido.replace(
      /<dDV>[^<]+<\/dDV>/,
      `<dDV>${dv}</dDV>`
    );
    
    // Reemplazar tipo de RUC si existe
    xmlCorregido = xmlCorregido.replace(
      /<dTipoRuc>[^<]+<\/dTipoRuc>/,
      `<dTipoRuc>${tipoRuc}</dTipoRuc>`
    );
    
    console.log(`🔧 RUC corregido en XML: ${rucPrueba}`);
    
    return xmlCorregido;
    
  } catch (error) {
    console.error('Error al corregir RUC en XML:', error);
    return xmlDocumento; // Retornar XML original si hay error
  }
}

