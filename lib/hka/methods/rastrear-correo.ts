import { getHKAClient } from '../soap/client';
import { RastreoCorreoParams, RastreoCorreoResponse, RastreoCorreoEstado } from '../soap/types';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';

/**
 * Mapea el estado de HKA al enum EmailStatus de Prisma
 */
export function mapHKAToEmailStatus(estado: RastreoCorreoEstado): 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED' {
  const mapping: Record<RastreoCorreoEstado, 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED'> = {
    ENVIADO: 'SENT',
    ENTREGADO: 'DELIVERED',
    REBOTADO: 'BOUNCED',
    FALLIDO: 'FAILED',
  };

  return mapping[estado] || 'FAILED';
}

/**
 * Rastrea el estado de entrega de un correo electrónico usando el método RastreoCorreo de HKA
 */
export async function rastrearCorreoHKA(trackingId: string): Promise<RastreoCorreoResponse> {
  try {
    if (!trackingId || trackingId.trim() === '') {
      throw new Error('Tracking ID es requerido para rastrear el correo');
    }

    console.log(`🔍 Rastreando correo con ID: ${trackingId}`);

    const hkaClient = getHKAClient();
    const credentials = hkaClient.getCredentials();

    // Construir parámetros
    const params: RastreoCorreoParams = {
      IdRastreo: trackingId,
      TokenEmpresa: credentials.tokenEmpresa,
      TokenPassword: credentials.tokenPassword,
    };

    // Invocar método SOAP "RastreoCorreo" con monitoreo
    const response = await monitorHKACall('RastreoCorreo', async () => {
      return await hkaClient.invoke<RastreoCorreoResponse>('RastreoCorreo', params);
    });

    // Validar respuesta
    if (!response.Exito) {
      throw new Error(response.dMsgRes || 'Error al rastrear correo electrónico');
    }

    console.log(`✅ Estado del correo: ${response.Estado}`);
    console.log(`   Tracking ID: ${response.IdRastreo}`);
    console.log(`   Destinatario: ${response.CorreoDestinatario}`);
    if (response.FechaEntrega) {
      console.log(`   Fecha de entrega: ${response.FechaEntrega}`);
    }

    return response;
  } catch (error) {
    console.error('❌ Error al rastrear correo:', error);
    throw error;
  }
}
