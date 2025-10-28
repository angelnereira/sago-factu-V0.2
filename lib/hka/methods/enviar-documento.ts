import { getHKAClient } from '../soap/client';
import { EnviarDocumentoParams, EnviarDocumentoResponse } from '../soap/types';
import { prisma } from '@/lib/db';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';

/**
 * Envía un documento electrónico a HKA (Factura, Nota Crédito, Nota Débito)
 */
export async function enviarDocumento(
  xmlDocumento: string,
  invoiceId: string
): Promise<EnviarDocumentoResponse> {
  try {
    const hkaClient = getHKAClient();
    const credentials = hkaClient.getCredentials();

    console.log(`📤 Enviando documento a HKA para invoice: ${invoiceId}`);

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
    const response = await monitorHKACall('Enviar', async () => {
      return await hkaClient.invoke<EnviarDocumentoResponse>('Enviar', params);
    });

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

