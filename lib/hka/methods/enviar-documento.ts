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

        // Validación defensiva de credenciales antes de invocar HKA
        if (!credentials?.tokenEmpresa || !credentials?.tokenPassword) {
          throw new Error(
            'Credenciales HKA ausentes o inválidas (tokenEmpresa/tokenPassword). Verifica configuración de la organización o del modo SIMPLE.',
          );
        }

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

        // Validar estructura mínima del XML (RUC/DV y al menos un item)
        const hasRuc = /<dRuc>[^<]+<\/dRuc>/.test(xmlLimpio);
        const hasDv = /<dDV>[^<]+<\/dDV>/.test(xmlLimpio);
        // El generador usa múltiples nodos <gItem> (no un contenedor plural)
        const hasItems = /<gItem>/.test(xmlLimpio);
        if (!hasRuc || !hasDv || !hasItems) {
          throw new Error(
            'XML incompleto para HKA: faltan RUC/DV del emisor o no se encontraron ítems. Revisa datos del emisor/receptor e ítems.',
          );
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

    // Verificar si la respuesta indica éxito
    const isSuccess = response.Exito !== false && response.dCodRes === '0200';
    
    // Determinar mensaje de error si existe
    let errorMessage = response.dMsgRes;
    if (response.Errores && response.Errores.length > 0) {
      errorMessage = response.Errores.map((err) => `${err.Codigo}: ${err.Descripcion}`).join('; ');
    }

    // Actualizar en base de datos con Prisma - CAPTURA COMPLETA DE RESPUESTA
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        // Códigos de identificación
        cufe: response.dCufe,
        cafe: response.CAFE,
        numeroDocumentoFiscal: response.NumeroDocumentoFiscal,
        hkaProtocol: response.dProtocolo || response.ProtocoloAutorizacion,
        
        // Archivos en Base64 (priorizar campos nuevos de la guía, luego legacy)
        pdfBase64: response.PDF || response.xContPDF,
        qrCode: response.CodigoQR || response.dQr,
        rawXml: response.XMLFirmado, // XML firmado por DGI
        
        // Metadatos HKA
        hkaResponseCode: response.dCodRes,
        hkaResponseMessage: errorMessage || response.Mensaje || response.dMsgRes,
        hkaProtocolDate: response.FechaRecepcion ? new Date(response.FechaRecepcion) : null,
        
        // Estado
        status: isSuccess ? 'CERTIFIED' : 'REJECTED',
        certifiedAt: isSuccess ? new Date() : null,
      },
    });

    console.log(`💾 Respuesta de HKA guardada en BD`);
    console.log(`   PDF: ${response.PDF || response.xContPDF ? 'Sí' : 'No'}`);
    console.log(`   XML Firmado: ${response.XMLFirmado ? 'Sí' : 'No'}`);
    console.log(`   QR: ${response.CodigoQR || response.dQr ? 'Sí' : 'No'}`);

    return response;
  } catch (error) {
    console.error('❌ Error al enviar documento:', error);
    
    // Determinar mensaje de error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar a HKA';
    
    // Actualizar error en base de datos
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'REJECTED',
        hkaResponseCode: 'ERROR',
        hkaResponseMessage: errorMessage,
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

