import { getHKAClient } from '../soap/client';
import { NotaDebitoParams, NotaDebitoResponse } from '../soap/types';
import { prisma } from '@/lib/db';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';

/**
 * Emite una Nota de Débito
 * Se usa para aumentar el monto de una factura
 */
export async function emitirNotaDebito(
  xmlNotaDebito: string,
  cufeFacturaOriginal: string,
  invoiceId: string
): Promise<NotaDebitoResponse> {
  try {
    console.log(`📋 Emitiendo Nota de Débito`);
    console.log(`   Referencia: ${cufeFacturaOriginal}`);
    
    const hkaClient = getHKAClient();
    const credentials = hkaClient.getCredentials();

    // Validar que la factura original exista
    const facturaOriginal = await prisma.invoice.findFirst({
      where: { cufe: cufeFacturaOriginal },
      select: { id: true },
    });

    if (!facturaOriginal) {
      throw new Error('Factura original no encontrada');
    }

    // Parámetros para nota de débito
    const params: NotaDebitoParams = {
      tokenEmpresa: credentials.tokenEmpresa,
      tokenPassword: credentials.tokenPassword,
      documento: xmlNotaDebito,
      dCufeReferencia: cufeFacturaOriginal,
    };

    // Invocar método SOAP con monitoreo
    const response = await monitorHKACall('NotaDebitoFE', async () => {
      return await hkaClient.invoke<NotaDebitoResponse>('NotaDebitoFE', params);
    });

    console.log(`✅ Nota de Débito emitida exitosamente`);
    console.log(`   CUFE: ${response.dCufe}`);
    console.log(`   Protocolo: ${response.dProtocolo}`);

    // Actualizar en base de datos
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        cufe: response.dCufe,
        // hkaProtocol: response.dProtocolo, // TODO: Agregar campo al schema
        qrCode: response.dQr,
        // hkaResponseCode: response.dCodRes, // TODO: Agregar campo al schema
        // hkaResponseMessage: response.dMsgRes, // TODO: Agregar campo al schema
        status: response.dCodRes === '0200' ? 'CERTIFIED' : 'REJECTED',
        // referenceInvoiceId: facturaOriginal.id, // TODO: Agregar campo al schema
      },
    });

    return response;
  } catch (error) {
    console.error('❌ Error al emitir nota de débito:', error);
    throw error;
  }
}

