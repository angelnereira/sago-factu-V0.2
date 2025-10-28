/**
 * Wrapper de Monitoreo para Llamadas HKA
 * Captura métricas, logs y errores de todas las llamadas HKA
 */

import { prismaServer as prisma } from '@/lib/prisma-server';

interface HKAMonitorResult {
  success: boolean;
  method: string;
  duration: number;
  statusCode?: string;
  errorMessage?: string;
  timestamp: Date;
}

/**
 * Wrapper para monitorear llamadas HKA
 */
export async function monitorHKACall<T>(
  method: string,
  callFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const timestamp = new Date();
  
  try {
    // Ejecutar llamada
    const result = await callFn();
    
    const duration = Date.now() - startTime;
    
    // Registrar éxito (async, no bloquea)
    logHKACall({
      success: true,
      method,
      duration,
      timestamp,
    }).catch(err => console.error('Error logging HKA call:', err));
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Registrar fallo (async, no bloquea)
    logHKACall({
      success: false,
      method,
      duration,
      errorMessage,
      timestamp,
    }).catch(err => console.error('Error logging HKA call:', err));
    
    // Re-lanzar error para que el código original maneje el error
    throw error;
  }
}

/**
 * Registra llamada HKA en base de datos
 */
async function logHKACall(result: HKAMonitorResult) {
  try {
    // Verificar si hay un monitor de HKA activo
    const activeMonitors = await prisma.monitor.findMany({
      where: {
        enabled: true,
        name: {
          contains: 'HKA',
        },
      },
      take: 1,
    });
    
    if (activeMonitors.length > 0) {
      const monitor = activeMonitors[0];
      
      // Buscar el último run activo del monitor
      const lastRun = await prisma.monitorRun.findFirst({
        where: {
          monitorId: monitor.id,
          status: 'RUNNING',
        },
        orderBy: { startedAt: 'desc' },
      });
      
      if (lastRun) {
        // Crear registro de request
        await prisma.monitorRunRequest.create({
          data: {
            runId: lastRun.id,
            requestName: `HKA: ${result.method}`,
            method: 'POST',
            url: `/hka/${result.method}`,
            statusCode: result.success ? 200 : 500,
            responseTime: result.duration,
            passedTests: result.success ? 1 : 0,
            failedTests: result.success ? 0 : 1,
            error: result.errorMessage,
          },
        });
      }
    }
    
    // También loguear en console para debugging
    console.log(`📊 HKA Monitor: ${result.method} - ${result.success ? '✅' : '❌'} (${result.duration}ms)`);
    
  } catch (error) {
    // Silently fail para no afectar el flujo principal
    console.error('Error logging HKA call to database:', error);
  }
}

/**
 * Obtiene estadísticas de llamadas HKA
 */
export async function getHKAStatistics() {
  try {
    const recentRuns = await prisma.monitorRun.findMany({
      where: {
        monitor: {
          name: {
            contains: 'HKA',
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });
    
    const stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      methods: {} as Record<string, { total: number; success: number; failed: number; avgTime: number }>,
    };
    
    const responseTimes: number[] = [];
    
    for (const run of recentRuns) {
      for (const request of run.requests) {
        stats.totalCalls++;
        
        if (request.passedTests > 0) {
          stats.successfulCalls++;
        } else {
          stats.failedCalls++;
        }
        
        if (request.responseTime) {
          responseTimes.push(request.responseTime);
        }
        
        // Parse method from request name
        const methodMatch = request.requestName.match(/HKA: (\w+)/);
        if (methodMatch) {
          const method = methodMatch[1];
          if (!stats.methods[method]) {
            stats.methods[method] = { total: 0, success: 0, failed: 0, avgTime: 0 };
          }
          stats.methods[method].total++;
          if (request.passedTests > 0) {
            stats.methods[method].success++;
          } else {
            stats.methods[method].failed++;
          }
          if (request.responseTime) {
            const times = stats.methods[method].avgTime;
            const count = stats.methods[method].total;
            stats.methods[method].avgTime = Math.round((times + request.responseTime) / 2);
          }
        }
      }
    }
    
    stats.averageResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    return stats;
  } catch (error) {
    console.error('Error getting HKA statistics:', error);
    return null;
  }
}

