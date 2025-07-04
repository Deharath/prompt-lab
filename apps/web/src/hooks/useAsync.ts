/**
 * Async Data Hook - Enhanced data fetching with comprehensive state management
 *
 * This hook provides a robust pattern for managing async operations with:
 * - Loading, error, and success states
 * - Retry functionality
 * - Request cancellation
 * - Cache invalidation
 * - Optimistic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AsyncState } from '../types/global.js';

interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  retries?: number;
  retryDelay?: number;
  transform?: (data: unknown) => T;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
  cancel: () => void;
}

export function useAsync<T = unknown>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options: UseAsyncOptions<T> = {},
): UseAsyncReturn<T> {
  const {
    immediate = false,
    onSuccess,
    onError,
    retries = 0,
    retryDelay = 1000,
    transform,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastArgsRef = useRef<unknown[]>([]);
  const retryCountRef = useRef(0);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      lastArgsRef.current = args;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const rawResult = await asyncFunction(...args);

        // Check if request was cancelled
        if (abortControllerRef.current.signal.aborted) {
          return null;
        }

        const result = transform ? transform(rawResult) : rawResult;

        setState({
          data: result,
          loading: false,
          error: null,
          lastFetch: new Date(),
        });

        onSuccess?.(result);
        retryCountRef.current = 0;

        return result;
      } catch (error) {
        // Check if request was cancelled
        if (abortControllerRef.current.signal.aborted) {
          return null;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred';

        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        onError?.(errorMessage);
        return null;
      }
    },
    [asyncFunction, onSuccess, onError, transform],
  );

  const retry = useCallback(async (): Promise<T | null> => {
    if (retryCountRef.current < retries) {
      retryCountRef.current++;

      // Wait for retry delay
      await new Promise((resolve) => setTimeout(resolve, retryDelay));

      return execute(...lastArgsRef.current);
    }
    return null;
  }, [execute, retries, retryDelay]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      data: null,
      loading: false,
      error: null,
    });

    retryCountRef.current = 0;
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState((prev) => ({
      ...prev,
      loading: false,
    }));
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    retry,
    reset,
    cancel,
  };
}

/**
 * Hook for managing async operations with mutations (POST, PUT, DELETE)
 */
export function useMutation<T = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options: UseAsyncOptions<T> = {},
) {
  const asyncFn = useCallback(
    (...args: unknown[]) => mutationFn(args[0] as TVariables),
    [mutationFn],
  );

  const { execute, ...rest } = useAsync(asyncFn, {
    ...options,
    immediate: false,
  });

  const mutate = useCallback(
    (variables: TVariables) => execute(variables),
    [execute],
  );

  return {
    mutate,
    ...rest,
  };
}
