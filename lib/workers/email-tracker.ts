import { Worker, Queue, WorkerOptions, Job } from 'bullmq';
import { getRedisConnection } from '@/lib/queue/invoice-queue';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { rastrearCorreoHKA, mapHKAToEmailStatus } from '@/lib/hka/methods/rastrear-correo';

/**
 * Worker para tracking automático de correos electrónicos
 * Consulta periódicamente el estado de correos enviados usando RastreoCorreo de HKA
 */

interface EmailTrackingJobData {
  // Vacío - el job procesa todos los correos pendientes
}

// Configuración del worker
const workerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 1, // Procesar uno a la vez para no sobrecargar HKA
  maxStalledCount: 1,
};

// Singleton del worker
let emailTrackerWorkerInstance: Worker | null = null;

// Singleton de la cola
let emailTrackerQueueInstance: Queue<EmailTrackingJobData> | null = null;

/**
 * Procesa todos los correos con estado SENT o PENDING
 */
async function processEmailTracking(job: Job<EmailTrackingJobData>): Promise<void> {
  console.log(`📧 Iniciando tracking de correos...`);

  try {
    // Buscar todos los correos que necesitan tracking
    const emailsToTrack = await prisma.emailDelivery.findMany({
      where: {
        status: {
          in: ['SENT', 'PENDING'],
        },
        hkaTrackingId: {
          not: null,
        },
      },
      take: 100, // Limitar a 100 por ejecución para no sobrecargar
    });

    console.log(`   Encontrados ${emailsToTrack.length} correos para rastrear`);

    let updated = 0;
    let errors = 0;

    for (const email of emailsToTrack) {
      if (!email.hkaTrackingId) continue;

      try {
        // Rastrear correo en HKA
        const hkaResponse = await rastrearCorreoHKA(email.hkaTrackingId);

        // Mapear estado de HKA a EmailStatus
        const newStatus = mapHKAToEmailStatus(hkaResponse.Estado);

        // Preparar datos de actualización
        const updateData: any = {
          status: newStatus,
        };

        if (hkaResponse.FechaEnvio) {
          updateData.sentAt = new Date(hkaResponse.FechaEnvio);
        }

        if (hkaResponse.FechaEntrega && newStatus === 'DELIVERED') {
          updateData.deliveredAt = new Date(hkaResponse.FechaEntrega);
        }

        if (newStatus === 'BOUNCED' || newStatus === 'FAILED') {
          updateData.lastError = hkaResponse.dMsgRes || 'Error de entrega';
          updateData.retryCount = email.retryCount + 1;
        }

        // Actualizar en base de datos
        await prisma.emailDelivery.update({
          where: { id: email.id },
          data: updateData,
        });

        updated++;
        console.log(`   ✅ Email ${email.id}: ${email.status} → ${newStatus}`);

        // Pequeña pausa para no sobrecargar HKA
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        errors++;
        console.error(`   ❌ Error rastreando email ${email.id}:`, error);
        // Continuar con el siguiente
      }
    }

    console.log(`📊 Tracking completado: ${updated} actualizados, ${errors} errores`);
  } catch (error) {
    console.error('❌ Error en proceso de tracking:', error);
    throw error;
  }
}

/**
 * Iniciar el worker
 */
export function startEmailTrackerWorker(): Worker {
  if (emailTrackerWorkerInstance) {
    console.log('⚠️  Email Tracker Worker ya está corriendo');
    return emailTrackerWorkerInstance;
  }

  console.log('🚀 Iniciando Email Tracker Worker...');

  emailTrackerWorkerInstance = new Worker<EmailTrackingJobData>(
    'email-tracking',
    processEmailTracking,
    workerOptions
  );

  // Event listeners
  emailTrackerWorkerInstance.on('completed', () => {
    console.log('✅ Email tracking job completado');
  });

  emailTrackerWorkerInstance.on('failed', (job, error) => {
    console.error(`❌ Email tracking job ${job?.id} falló:`, error);
  });

  emailTrackerWorkerInstance.on('error', (error) => {
    console.error('❌ Error en Email Tracker Worker:', error);
  });

  console.log('✅ Email Tracker Worker iniciado correctamente');

  return emailTrackerWorkerInstance;
}

/**
 * Obtener la cola de tracking
 */
export function getEmailTrackerQueue(): Queue<EmailTrackingJobData> {
  if (!emailTrackerQueueInstance) {
    emailTrackerQueueInstance = new Queue('email-tracking', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: {
          age: 86400, // Mantener por 24 horas
          count: 100,
        },
        removeOnFail: {
          age: 604800, // Mantener fallos por 7 días
        },
      },
    });
  }

  return emailTrackerQueueInstance;
}

/**
 * Programar job recurrente de tracking (cada 10 minutos)
 */
export async function scheduleRecurringTracking(): Promise<void> {
  const queue = getEmailTrackerQueue();

  // Eliminar jobs recurrentes anteriores si existen
  await queue.obliterate({ force: true });

  // Crear job recurrente
  await queue.add(
    'track-emails',
    {},
    {
      repeat: {
        every: 600000, // 10 minutos
      },
      jobId: 'recurring-email-tracking',
    }
  );

  console.log('⏰ Job recurrente de tracking programado (cada 10 minutos)');
}

/**
 * Detener el worker
 */
export async function stopEmailTrackerWorker(): Promise<void> {
  if (emailTrackerWorkerInstance) {
    await emailTrackerWorkerInstance.close();
    emailTrackerWorkerInstance = null;
    console.log('✅ Email Tracker Worker detenido');
  }
}

/**
 * Obtener instancia del worker si está corriendo
 */
export function getEmailTrackerWorker(): Worker | null {
  return emailTrackerWorkerInstance;
}
