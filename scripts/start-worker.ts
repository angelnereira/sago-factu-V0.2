#!/usr/bin/env tsx

/**
 * Script para iniciar el Worker de BullMQ
 * 
 * Uso:
 *   npx tsx scripts/start-worker.ts
 * 
 * Este script:
 * 1. Inicia el worker de procesamiento de facturas
 * 2. Mantiene el proceso corriendo
 * 3. Maneja señales de terminación gracefulmente
 */

import { startInvoiceWorker, stopInvoiceWorker } from '@/lib/workers/invoice-worker';

console.log('🚀 Iniciando Worker de Procesamiento de Facturas...\n');

// Iniciar el worker
const worker = startInvoiceWorker();

// Manejar señales de terminación
const gracefulShutdown = async (signal: string) => {
  console.log(`\n📡 Señal ${signal} recibida. Cerrando worker...`);
  
  try {
    await stopInvoiceWorker();
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

console.log('✅ Worker iniciado. Esperando trabajos...');
console.log('💡 Presiona Ctrl+C para detener el worker\n');

// Mantener el proceso activo
setInterval(() => {
  // Worker está corriendo (esto evita que el proceso termine)
}, 1000);
