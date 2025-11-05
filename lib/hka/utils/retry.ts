/**
 * Sistema de reintentos con exponential backoff para operaciones HKA
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number; // Multiplicador para exponential backoff
  retryableErrors?: string[]; // Códigos de error que deben reintentarse
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
}

/**
 * Retryable error codes
 */
const DEFAULT_RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'TIMEOUT',
  'ENETUNREACH',
];

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error | any): boolean {
  const errorCode = error?.code || error?.errno || '';
  const errorMessage = error?.message || '';
  
  // Check error code
  if (typeof errorCode === 'string') {
    if (DEFAULT_RETRYABLE_ERRORS.includes(errorCode)) {
      return true;
    }
  }

  // Check error message for common retryable patterns
  const retryablePatterns = [
    'timeout',
    'connection',
    'network',
    'ECONN',
    'ETIMEDOUT',
    'ENOTFOUND',
    'socket',
    'temporary',
    'retry',
  ];

  const lowerMessage = errorMessage.toLowerCase();
  return retryablePatterns.some(pattern => lowerMessage.includes(pattern));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  factor: number
): number {
  const delay = initialDelayMs * Math.pow(factor, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    initialDelayMs = 2000,
    maxDelayMs = 10000,
    factor = 2,
    retryableErrors = DEFAULT_RETRYABLE_ERRORS,
  } = options;

  let lastError: Error | undefined;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;

    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        // Non-retryable error, return immediately
        return {
          success: false,
          error: lastError,
          attempts,
        };
      }

      // If this is the last attempt, don't wait
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, initialDelayMs, maxDelayMs, factor);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError || new Error('Unknown error after retries'),
    attempts,
  };
}

/**
 * Execute function with retry and throw error if all retries fail
 */
export async function withRetryOrThrow<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await withRetry(fn, options);

  if (result.success && result.result !== undefined) {
    return result.result;
  }

  const error = result.error || new Error('Unknown error');
  const attempts = result.attempts;

  // Enhance error message with retry information
  const enhancedError = new Error(
    `${error.message} (failed after ${attempts} attempt${attempts > 1 ? 's' : ''})`
  );
  enhancedError.stack = error.stack;
  (enhancedError as any).originalError = error;
  (enhancedError as any).attempts = attempts;

  throw enhancedError;
}

