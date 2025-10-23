import { getHKAClient } from '../soap/client';
import { NotaCreditoParams, NotaCreditoResponse } from '../soap/types';
import { prisma } from '@/lib/db';

/**
 * Emite una Nota de Crédito
 * Se usa para corregir o revertir facturas después de 7 días
 * Máximo 180 días (6 meses) después de la factura original
 */
export async function emitirNotaCredito(
  xmlNotaCredito: string,
  cufeFacturaOriginal: string,
  invoiceId: string
): Promise<NotaCreditoResponse> {
  try {
    console.log(`📋 Emitiendo Nota de Crédito`);
    console.log(`   Referencia: ${cufeFacturaOriginal}`);
    
    const hkaClient = getHKAClient();
    const credentials = hkaClient.getCredentials();

    // Validar que la factura original exista
    const facturaOriginal = await prisma.invoice.findFirst({
      where: { cufe: cufeFacturaOriginal },
      select: { createdAt: true, id: true },
    });

    if (!facturaOriginal) {
      throw new Error('Factura original no encontrada');
    }

    // Validar que no hayan pasado más de 180 días
    const daysSinceOriginal = Math.floor(
      (Date.now() - facturaOriginal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceOriginal > 180) {
      throw new Error('Han pasado más de 180 días desde la factura original');
    }

    // Parámetros para nota de crédito
    const params: NotaCreditoParams = {
      tokenEmpresa: credentials.tokenEmpresa,
      tokenPassword: credentials.tokenPassword,
      documento: xmlNotaCredito,
      dCufeReferencia: cufeFacturaOriginal,
    };

    // Invocar método SOAP
    const response = await hkaClient.invoke<NotaCreditoResponse>(
      'NotaCreditoFE',
      params
    );

    console.log(`✅ Nota de Crédito emitida exitosamente`);
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
    console.error('❌ Error al emitir nota de crédito:', error);
    throw error;
  }
}

