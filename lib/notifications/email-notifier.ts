/**
 * Sistema de Notificaciones por Email
 * Integración con Resend
 */

import { prismaServer as prisma } from '@/lib/prisma-server';

interface NotificationConfig {
  enabled: boolean;
  recipients: string[];
  triggers: string[];
}

interface MonitorResult {
  runId: string;
  monitorId: string;
  status: string;
  failedRequests: number;
  totalRequests: number;
  error?: string;
}

export async function sendMonitorNotification(
  monitorId: string,
  result: MonitorResult
) {
  try {
    // Buscar monitor con configuración de notificaciones
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor || !monitor.notifications) {
      return;
    }

    const config = monitor.notifications as NotificationConfig;

    if (!config.enabled || !config.recipients || config.recipients.length === 0) {
      return;
    }

    // Determinar si debemos enviar notificación
    const shouldNotify = shouldSendNotification(result, config);

    if (!shouldNotify) {
      return;
    }

    // Enviar email
    await sendEmail(monitor.name, result, config.recipients);

    // Registrar en base de datos
    await prisma.user.updateMany({
      where: { email: { in: config.recipients } },
      data: {
        // TODO: Crear registro de notificación enviada
      },
    });

  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}

function shouldSendNotification(
  result: MonitorResult,
  config: NotificationConfig
): boolean {
  for (const trigger of config.triggers) {
    switch (trigger) {
      case 'test_failure':
        if (result.failedRequests > 0) {
          return true;
        }
        break;
      case 'error':
        if (result.status === 'FAILED' || result.error) {
          return true;
        }
        break;
      case 'timeout':
        if (result.status === 'TIMEOUT') {
          return true;
        }
        break;
    }
  }
  return false;
}

async function sendEmail(
  monitorName: string,
  result: MonitorResult,
  recipients: string[]
) {
  // TODO: Integrar con Resend
  // Por ahora, solo loguear

  const subject = `[SAGO-FACTU] Monitor: ${monitorName}`;
  const body = `
Monitor: ${monitorName}
Estado: ${result.status}
Requests: ${result.failedRequests}/${result.totalRequests} fallaron

${result.error ? `Error: ${result.error}` : ''}

Ver detalles en: https://app.sagofactu.com/dashboard/monitores
  `.trim();

  console.log('Enviando email:');
  console.log('To:', recipients.join(', '));
  console.log('Subject:', subject);
  console.log('Body:', body);
}

