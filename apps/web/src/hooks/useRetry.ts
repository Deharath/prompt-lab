import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  backoffFactor?: number;
  maxDelay?: number;
}

interface RetryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  attempt: number;
  canRetry: boolean;
}

/**
 * Hook for handling operations with automatic retry logic and exponential backoff
 */
export function useRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    maxDelay = 10000,
  } = options;

  const [state, setState] = useState<RetryState<T>>({
    data: null,
    error: null,
    isLoading: false,
    attempt: 0,
    canRetry: true,
  });

  const execute = useCallback(async () => {
    if (state.isLoading) return;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await operation();
      setState({
        data: result,
        error: null,
        isLoading: false,
        attempt: 0,
        canRetry: true,
      });
      return result;
    } catch (error) {
      const newAttempt = state.attempt + 1;
      const canRetry = newAttempt < maxAttempts;

      setState({
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false,
        attempt: newAttempt,
        canRetry,
      });

      if (canRetry) {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, newAttempt - 1),
          maxDelay,
        );

        // Automatically retry after delay
        setTimeout(() => {
          execute();
        }, delay);
      }

      throw error;
    }
  }, [
    operation,
    state.attempt,
    state.isLoading,
    maxAttempts,
    initialDelay,
    backoffFactor,
    maxDelay,
  ]);

  const retry = useCallback(() => {
    if (state.canRetry && !state.isLoading) {
      execute();
    }
  }, [execute, state.canRetry, state.isLoading]);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      attempt: 0,
      canRetry: true,
    });
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
  };
}

/**
 * Higher-order component that wraps API calls with retry logic
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {},
) {
  return async (...args: T): Promise<R> => {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      backoffFactor = 2,
      maxDelay = 10000,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt === maxAttempts - 1) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt),
          maxDelay,
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
}

export default useRetry;
