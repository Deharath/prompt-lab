import { TIMEOUTS, SECURITY } from '../constants/index.js';
import { categorizeError, shouldRetryError } from '../errors/JobError.js';
import { log } from '../utils/logger.js';

interface ResilienceOptions {
  timeoutMs?: number;
  maxRetries?: number;
  requestId?: string;
  provider?: string;
  model?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

export async function callWithResilience<T>(
  label: string,
  fn: () => Promise<T>,
  options: ResilienceOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? TIMEOUTS.EVALUATION_DEFAULT;
  const maxRetries = options.maxRetries ?? SECURITY.MAX_RETRIES;
  let attempt = 0;
  // basic backoff parameters
  const baseDelay = 500;

  while (true) {
    attempt += 1;
    const start = Date.now();
    try {
      const result = await withTimeout(fn(), timeoutMs);
      const duration = Date.now() - start;
      log.info('Provider call success', {
        type: 'provider_call',
        label,
        duration,
        attempt,
        provider: options.provider,
        model: options.model,
        requestId: options.requestId,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const categorized = categorizeError(error);
      log.warn('Provider call failed', {
        type: 'provider_call_failed',
        label,
        duration,
        attempt,
        errorType: categorized.type,
        retryable: categorized.retryable,
        provider: options.provider,
        model: options.model,
        requestId: options.requestId,
      });

      if (!shouldRetryError(categorized.type, attempt, maxRetries)) {
        throw error instanceof Error ? error : new Error(String(error));
      }

      const retryDelay =
        categorized.retryDelay ??
        Math.min(5000, baseDelay * 2 ** (attempt - 1));
      await new Promise((r) => setTimeout(r, retryDelay));
      // loop to retry
    }
  }
}
