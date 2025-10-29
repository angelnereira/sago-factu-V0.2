#!/usr/bin/env tsx

/**
 * Script para iniciar los Workers de BullMQ
 * 
 * Uso:
 *   npx tsx scripts/start-worker.ts
 * 
 * Este script:
 * 1. Inicia el worker de procesamiento de facturas
 * 2. Inicia el worker de tracking de correos electrónicos
 * 3. Programa el tracking recurrente (cada 10 minutos)
 * 4. Mantiene el proceso corriendo
 * 5. Maneja señales de terminación gracefulmente
 */

import { startInvoiceWorker, stopInvoiceWorker } from '@/lib/workers/invoice-worker';
import { 
  startEmailTrackerWorker, 
  stopEmailTrackerWorker,
  scheduleRecurringTracking 
} from '@/lib/workers/email-tracker';

console.log('🚀 Iniciando Workers...\n');

// Iniciar el worker de facturas
const invoiceWorker = startInvoiceWorker();

// Iniciar el worker de tracking de correos
const emailTrackerWorker = startEmailTrackerWorker();

// Programar tracking recurrente
scheduleRecurringTracking().catch(console.error);

// Manejar señales de terminación
const gracefulShutdown = async (signal: string) => {
  console.log(`\n📡 Señal ${signal} recibida. Cerrando worker...`);
  
  try {
    await Promise.all([
      stopInvoiceWorker(),
      stopEmailTrackerWorker(),
    ]);
    console.log('✅ Worker cerrado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar worker:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('✅ Workers iniciados. Esperando trabajos...');
console.log('💡 Presiona Ctrl+C para detener los workers\n');

// Mantener el proceso activo
setInterval(() => {
  // Worker está corriendo (esto evita que el proceso termine)
}, 1000);
