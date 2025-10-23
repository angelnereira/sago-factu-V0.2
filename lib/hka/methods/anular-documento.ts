import { getHKAClient } from '../soap/client';
import { AnularDocumentoParams, AnularDocumentoResponse } from '../soap/types';
import { prisma } from '@/lib/db';

/**
 * Anula un documento electrónico en HKA
 * IMPORTANTE: Solo se puede anular dentro de los primeros 7 días
 */
export async function anularDocumento(
  cufe: string,
  motivo: string,
  invoiceId: string
): Promise<AnularDocumentoResponse> {
  try {
    console.log(`🚫 Anulando documento con CUFE: ${cufe}`);
    console.log(`   Motivo: ${motivo}`);

    const hkaClient = getHKAClient();
    const credentials = hkaClient.getCredentials();

    // Validar que no hayan pasado más de 7 días
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { createdAt: true, cufe: true },
    });

    if (invoice) {
      const daysSinceCreation = Math.floor(
        (Date.now() - invoice.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation > 7) {
        throw new Error(
          'No se puede anular: han pasado más de 7 días. Debe emitir una Nota de Crédito.'
        );
      }
    }

    // Parámetros para anulación
    const params: AnularDocumentoParams = {
      tokenEmpresa: credentials.tokenEmpresa,
      tokenPassword: credentials.tokenPassword,
      dCufe: cufe,
      motivo,
    };

    // Invocar método SOAP
    const response = await hkaClient.invoke<AnularDocumentoResponse>(
      'AnulacionFE',
      params
    );

    console.log(`✅ Documento anulado exitosamente`);
    console.log(`   Protocolo de anulación: ${response.dProtocoloAnulacion}`);

    // Actualizar en base de datos
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED',
        // cancellationReason: motivo,
        // cancellationProtocol: response.dProtocoloAnulacion,
        // cancelledAt: new Date(),
      },
    });

    return response;
  } catch (error) {
    console.error('❌ Error al anular documento:', error);
    throw error;
  }
}

