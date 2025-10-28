/**
 * Worker Executor para Monitores API
 * Ejecuta HTTP requests y captura resultados
 */

import { prismaServer as prisma } from '@/lib/prisma-server';
import { sendMonitorNotification } from '@/lib/notifications/email-notifier';

interface RequestDefinition {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

interface CollectionDefinition {
  requests: RequestDefinition[];
}

export async function executeMonitor(runId: string, collection: CollectionDefinition) {
  try {
    const startTime = Date.now();
    
    // Ejecutar cada request de la colección
    for (const request of collection.requests) {
      await executeRequest(runId, request);
    }
    
    const duration = Date.now() - startTime;
    
    // Contar requests
    const totalRequests = await prisma.monitorRunRequest.count({
      where: { runId },
    });
    
    const failedRequests = await prisma.monitorRunRequest.count({
      where: { runId, status: { not: 'SUCCESS' } },
    });
    
    // Obtener monitorId
    const run = await prisma.monitorRun.findUnique({
      where: { id: runId },
    });
    
    if (!run) {
      throw new Error('Run no encontrado');
    }
    
    // Actualizar run como completado
    await prisma.monitorRun.update({
      where: { id: runId },
      data: {
        status: failedRequests > 0 ? 'FAILED' : 'SUCCESS',
        finishedAt: new Date(),
        duration,
        totalRequests,
        failedTests: failedRequests,
      },
    });
    
    // Enviar notificación si es necesario
    await sendMonitorNotification(run.monitorId, {
      runId,
      monitorId: run.monitorId,
      status: failedRequests > 0 ? 'FAILED' : 'SUCCESS',
      failedRequests,
      totalRequests,
    });
    
  } catch (error) {
    console.error('Error ejecutando monitor:', error);
    
    await prisma.monitorRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
    });
  }
}

async function executeRequest(runId: string, request: RequestDefinition) {
  try {
    const startTime = Date.now();
    
    // Crear request record
    const requestRecord = await prisma.monitorRunRequest.create({
      data: {
        runId,
        requestName: request.name,
        method: request.method,
        url: request.url,
        status: 'RUNNING',
      },
    });
    
    // Ejecutar HTTP request
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();
    
    // Actualizar request record
    await prisma.monitorRunRequest.update({
      where: { id: requestRecord.id },
      data: {
        statusCode: response.status,
        responseTime,
        responseSize: responseBody.length,
        responseBody,
        status: response.ok ? 'SUCCESS' : 'FAILED',
      },
    });
    
  } catch (error) {
    console.error('Error ejecutando request:', error);
    
    // TODO: Crear request record con error
  }
}
