/**
 * Rate Limiting con Upstash Redis
 * 
 * Protege endpoints contra abuso y ataques DoS
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configuración de Redis desde variables de entorno
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : new Redis({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

/**
 * Rate limiters por tipo de operación
 */
export const rateLimiters = {
  // API general: 100 requests/minuto por IP
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Creación de facturas: 20 requests/minuto por organización
  invoiceCreate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:invoice',
  }),

  // Envío a HKA: 10 requests/minuto (límite HKA recomendado)
  hkaSend: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:hka',
  }),

  // Login: 5 intentos cada 15 minutos
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // Signup: 3 registros por hora por IP
  signup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'ratelimit:signup',
  }),
};

/**
 * Verificar rate limit
 * 
 * @param limiter - Rate limiter a usar
 * @param identifier - Identificador único (IP, userId, etc.)
 * @returns Objeto con información del rate limit
 * @throws RateLimitError si se excede el límite
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ limit: number; reset: Date; remaining: number }> {
  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    throw new RateLimitError({
      limit,
      reset: new Date(reset),
      remaining: 0,
    });
  }

  return { limit, reset: new Date(reset), remaining };
}

/**
 * Error de Rate Limit
 */
export class RateLimitError extends Error {
  constructor(public details: {
    limit: number;
    reset: Date;
    remaining: number;
  }) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }

  /**
   * Obtener headers HTTP para respuesta de rate limit
   */
  toHeaders(): Record<string, string> {
    const retryAfter = Math.ceil((this.details.reset.getTime() - Date.now()) / 1000);

    return {
      'X-RateLimit-Limit': this.details.limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': this.details.reset.toISOString(),
      'Retry-After': retryAfter.toString(),
    };
  }
}

