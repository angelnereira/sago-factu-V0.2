import { getHKAClient } from '../soap/client';
import { ConsultarDocumentoParams, ConsultarDocumentoResponse } from '../soap/types';

/**
 * Consulta un documento electrónico en HKA por su CUFE
 */
export async function consultarDocumento(
  cufe: string
): Promise<ConsultarDocumentoResponse> {
  try {
    const hkaClient = getHKAClient();
    const environment = process.env.HKA_ENVIRONMENT === 'prod' ? 1 : 2;

    console.log(`🔍 Consultando documento con CUFE: ${cufe}`);

    // Parámetros para consulta
    const params: ConsultarDocumentoParams = {
      dVerForm: '1.00',
      dId: '01',
      iAmb: environment,
      dCufe: cufe,
    };

    // Invocar método SOAP con monitoreo
    const response = await monitorHKACall('ConsultaFE', async () => {
      return await hkaClient.invoke<ConsultarDocumentoResponse>('ConsultaFE', params);
    });

    console.log(`✅ Documento consultado exitosamente`);
    console.log(`   Código: ${response.dCodRes}`);
    console.log(`   Mensaje: ${response.dMsgRes}`);

    return response;
  } catch (error) {
    console.error('❌ Error al consultar documento:', error);
    throw error;
  }
}

/**
 * Obtiene el PDF de un documento por su CUFE
 */
export async function obtenerPdfDocumento(cufe: string): Promise<Buffer> {
  try {
    console.log(`📄 Obteniendo PDF para CUFE: ${cufe}`);
    
    const response = await consultarDocumento(cufe);
    
    if (!response.xContenFE?.rContFe?.xContPDF) {
      throw new Error('PDF no disponible en la respuesta');
    }

    // Decodificar Base64 a Buffer
    const pdfBuffer = Buffer.from(response.xContenFE.rContFe.xContPDF, 'base64');
    
    console.log(`✅ PDF obtenido exitosamente (${pdfBuffer.length} bytes)`);
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Error al obtener PDF:', error);
    throw error;
  }
}

/**
 * Obtiene el XML de un documento por su CUFE
 */
export async function obtenerXmlDocumento(cufe: string): Promise<string> {
  try {
    console.log(`📝 Obteniendo XML para CUFE: ${cufe}`);
    
    const response = await consultarDocumento(cufe);
    
    if (!response.xContenFE?.rContFe?.xFe) {
      throw new Error('XML no disponible en la respuesta');
    }

    const xml = response.xContenFE.rContFe.xFe;
    
    console.log(`✅ XML obtenido exitosamente (${xml.length} caracteres)`);
    
    return xml;
  } catch (error) {
    console.error('❌ Error al obtener XML:', error);
    throw error;
  }
}

