import { Worker, WorkerOptions, Job } from 'bullmq';
import { getRedisConnection } from '@/lib/queue/invoice-queue';
import { processInvoice } from './invoice-processor';
import type { ProcessInvoiceJobData, ProcessInvoiceResult } from './invoice-processor';

/**
 * BullMQ Worker para procesar facturas en background
 * 
 * Este worker:
 * 1. Escucha la cola 'invoice-processing'
 * 2. Procesa cada trabajo (job) que recibe
 * 3. Ejecuta processInvoice con los datos del trabajo
 * 4. Reporta progreso y resultados
 */

// Configuración del worker
const workerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 3, // Procesar hasta 3 facturas simultáneamente
  maxStalledCount: 1, // Reintentar si se detecta un trabajo "stalled"
};

// Singleton del worker
let invoiceWorkerInstance: Worker | null = null;

/**
 * Procesador de trabajos: función que se ejecuta para cada trabajo en la cola
 */
async function processJob(job: Job<ProcessInvoiceJobData>): Promise<ProcessInvoiceResult> {
  console.log('');
  console.log('='.repeat(60));
  console.log(`📋 Procesando trabajo ID: ${job.id}`);
  console.log(`   Invoice ID: ${job.data.invoiceId}`);
  console.log(`   Enviar a HKA: ${job.data.sendToHKA ? 'SÍ' : 'NO'}`);
  console.log(`   Enviar email: ${job.data.sendEmail ? 'SÍ' : 'NO'}`);
  console.log('='.repeat(60));
  
  try {
    // Actualizar progreso al inicio
    await job.updateProgress(0);
    
    // Ejecutar el procesamiento de la factura
    const result = await processInvoice(job);
    
    // Actualizar progreso al final
    await job.updateProgress(100);
    
    // Retornar resultado
    return result;
  } catch (error) {
    console.error(`❌ Error procesando trabajo ${job.id}:`, error);
    throw error; // Re-lanzar para que BullMQ lo maneje
  }
}

/**
 * Iniciar el worker
 */
export function startInvoiceWorker(): Worker {
  if (invoiceWorkerInstance) {
    console.log('⚠️  Worker ya está corriendo');
    return invoiceWorkerInstance;
  }
  
  console.log('🚀 Iniciando worker de procesamiento de facturas...');
  
  invoiceWorkerInstance = new Worker<ProcessInvoiceJobData, ProcessInvoiceResult>(
    'invoice-processing',
    processJob,
    workerOptions
  );
  
  // Event listeners para monitoreo
  invoiceWorkerInstance.on('completed', (job, result) => {
    console.log(`✅ Trabajo ${job.id} completado:`, {
      success: result.success,
      cufe: result.cufe,
      sentToHKA: result.sentToHKA,
    });
  });
  
  invoiceWorkerInstance.on('failed', (job, error) => {
    console.error(`❌ Trabajo ${job?.id} falló:`, {
      error: error.message,
      stack: error.stack,
    });
  });
  
  invoiceWorkerInstance.on('error', (error) => {
    console.error('❌ Error en worker:', error);
  });
  
  invoiceWorkerInstance.on('active', (job) => {
    console.log(`🔄 Trabajo ${job.id} iniciado`);
  });
  
  invoiceWorkerInstance.on('stalled', (jobId) => {
    console.warn(`⚠️  Trabajo ${jobId} stalled (colgado)`);
  });
  
  console.log('✅ Worker iniciado correctamente');
  
  return invoiceWorkerInstance;
}

/**
 * Detener el worker
 */
export async function stopInvoiceWorker(): Promise<void> {
  if (invoiceWorkerInstance) {
    console.log('🛑 Deteniendo worker...');
    await invoiceWorkerInstance.close();
    invoiceWorkerInstance = null;
    console.log('✅ Worker detenido');
  }
}

// Exportar instancia si ya está corriendo
export function getInvoiceWorker(): Worker | null {
  return invoiceWorkerInstance;
}
