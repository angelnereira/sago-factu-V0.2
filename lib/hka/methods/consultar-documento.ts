import { getHKAClient } from '../soap/client';
import { ConsultarDocumentoParams, ConsultarDocumentoResponse } from '../soap/types';
import { withHKACredentials } from '../credentials-manager';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';

/**
 * Consulta un documento electrónico en HKA por su CUFE
 */
export async function consultarDocumento(
  cufe: string,
  organizationId: string,
  options: { userId?: string } = {}
): Promise<ConsultarDocumentoResponse> {
  return withHKACredentials(
    organizationId,
    async () => {
      try {
        const hkaClient = getHKAClient();
        await hkaClient.initialize();
        const environment = (process.env.HKA_ENV === 'prod' || process.env.HKA_ENVIRONMENT === 'production') ? 1 : 2;

        console.log(`🔍 Consultando documento con CUFE: ${cufe}`);

        // Parámetros para consulta
        const params: ConsultarDocumentoParams = {
          dVerForm: '1.00',
          dId: '01',
          iAmb: environment,
          dCufe: cufe,
        };

        // Obtener credenciales para pasar a invokeWithCredentials
        const credentials = hkaClient.getCredentials();

        // Invocar método SOAP con monitoreo y credenciales inyectadas
        const response = await monitorHKACall('Consulta', async () => {
          return await hkaClient.invokeWithCredentials<ConsultarDocumentoResponse>('Consulta', params, credentials);
        });

        console.log(`✅ Documento consultado exitosamente`);
        console.log(`   Código: ${response.dCodRes}`);
        console.log(`   Mensaje: ${response.dMsgRes}`);

        return response;
      } catch (error) {
        console.error('❌ Error al consultar documento:', error);
        throw error;
      }
    },
    options
  );
}

/**
 * Obtiene el PDF de un documento por su CUFE
 */
export async function obtenerPdfDocumento(
  cufe: string,
  organizationId: string,
  options: { userId?: string } = {}
): Promise<Buffer> {
  try {
    console.log(`📄 Obteniendo PDF para CUFE: ${cufe}`);
    
    const response = await consultarDocumento(cufe, organizationId, options);
    
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
export async function obtenerXmlDocumento(
  cufe: string,
  organizationId: string,
  options: { userId?: string } = {}
): Promise<string> {
  try {
    console.log(`📝 Obteniendo XML para CUFE: ${cufe}`);
    
    const response = await consultarDocumento(cufe, organizationId, options);
    
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

