import { Queue, QueueOptions } from 'bullmq';
import { ConnectionOptions } from 'ioredis';

/**
 * Queue Configuration for BullMQ Invoice Processing
 * 
 * Configura la conexión a Redis y crea la cola para procesamiento de facturas
 */

// Configuración de conexión a Redis desde variables de entorno
export function getRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL no configurado. Usando configuración por defecto para desarrollo local.');
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // Requerido para BullMQ
    };
  }

  // Parsear URL de Redis (puede ser redis:// o rediss://)
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  } catch (error) {
    console.error('❌ Error parseando REDIS_URL:', error);
    throw new Error('REDIS_URL inválido. Formato esperado: redis://host:port o rediss://host:port');
  }
}

// Opciones de configuración de la cola
const queueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3, // Reintentar 3 veces
    backoff: {
      type: 'exponential',
      delay: 2000, // Esperar 2s, 4s, 8s entre reintentos
    },
    removeOnComplete: {
      age: 3600, // Mantener trabajos completados por 1 hora
      count: 1000, // Mantener máximo 1000 trabajos completados
    },
    removeOnFail: {
      age: 86400, // Mantener trabajos fallidos por 24 horas
    },
  },
};

// Singleton pattern para la cola
let invoiceQueueInstance: Queue | null = null;

/**
 * Obtener instancia singleton de la cola de facturas
 */
export function getInvoiceQueue(): Queue {
  if (!invoiceQueueInstance) {
    console.log('📦 Creando cola de procesamiento de facturas...');
    invoiceQueueInstance = new Queue('invoice-processing', queueOptions);
    
    // Event listeners para monitoreo
    invoiceQueueInstance.on('error', (error) => {
      console.error('❌ Error en cola de facturas:', error);
    });
    
    invoiceQueueInstance.on('waiting', (jobId) => {
      console.log(`⏳ Trabajo ${jobId} en espera...`);
    });
    
    invoiceQueueInstance.on('active', (job) => {
      console.log(`🔄 Procesando trabajo ${job.id}...`);
    });
    
    invoiceQueueInstance.on('completed', (job) => {
      console.log(`✅ Trabajo ${job.id} completado exitosamente`);
    });
    
    invoiceQueueInstance.on('failed', (job, error) => {
      console.error(`❌ Trabajo ${job?.id} falló:`, error.message);
    });
  }
  
  return invoiceQueueInstance;
}

/**
 * Cerrar conexión de la cola (útil para cleanup)
 */
export async function closeQueue(): Promise<void> {
  if (invoiceQueueInstance) {
    await invoiceQueueInstance.close();
    invoiceQueueInstance = null;
    console.log('🔌 Cola de facturas cerrada');
  }
}
