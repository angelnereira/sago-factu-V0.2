import { getHKAClient } from '../soap/client';
import { EnvioCorreoParams, EnvioCorreoResponse } from '../soap/types';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';

/**
 * Envía un correo electrónico con la factura adjunta usando el método EnvioCorreo de HKA
 */
export async function enviarCorreoHKA(
  params: Omit<EnvioCorreoParams, 'TokenEmpresa' | 'TokenPassword'>
): Promise<EnvioCorreoResponse> {
  try {
    console.log(`📧 Enviando correo a HKA para CAFE: ${params.CAFE}`);
    console.log(`   Destinatario: ${params.CorreoDestinatario}`);

    const hkaClient = getHKAClient();
    const credentials = hkaClient.getCredentials();

    // Construir parámetros completos con credenciales
    const fullParams: EnvioCorreoParams = {
      ...params,
      TokenEmpresa: credentials.tokenEmpresa,
      TokenPassword: credentials.tokenPassword,
    };

    // Invocar método SOAP "EnvioCorreo" con monitoreo y credenciales inyectadas
    const response = await monitorHKACall('EnvioCorreo', async () => {
      return await hkaClient.invokeWithCredentials<EnvioCorreoResponse>('EnvioCorreo', fullParams, credentials);
    });

    // Validar respuesta
    if (!response.Exito) {
      throw new Error(response.Mensaje || 'Error al enviar correo electrónico');
    }

    console.log(`✅ Correo enviado exitosamente`);
    console.log(`   Tracking ID: ${response.IdRastreo}`);
    console.log(`   Email: ${response.CorreoEnviado}`);
    console.log(`   Fecha: ${response.FechaEnvio}`);

    return response;
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw error;
  }
}
