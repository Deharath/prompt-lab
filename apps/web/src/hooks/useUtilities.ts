/**
 * Debounced Value Hook - Debounce state changes for performance
 *
 * This hook provides debounced state management for:
 * - Search inputs
 * - API calls
 * - Expensive operations
 * - Real-time filtering
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced Callback Hook - Debounce function calls
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttled Callback Hook - Throttle function calls
 */
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
): T {
  const callbackRef = useRef(callback);
  const lastRan = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        callbackRef.current(...args);
        lastRan.current = now;
      }
    },
    [delay],
  ) as T;

  return throttledCallback;
}

/**
 * Previous Value Hook - Track previous value of a state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * Toggle Hook - Boolean state with toggle functionality
 */
export function useToggle(
  initialValue = false,
): [boolean, () => void, (value?: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setToggle = useCallback(
    (newValue?: boolean) => {
      setValue(newValue ?? !value);
    },
    [value],
  );

  return [value, toggle, setToggle];
}

/**
 * Counter Hook - Numeric state with increment/decrement
 */
export function useCounter(
  initialValue = 0,
  { min, max }: { min?: number; max?: number } = {},
): {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
} {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => {
      const newValue = prev + 1;
      return max !== undefined ? Math.min(newValue, max) : newValue;
    });
  }, [max]);

  const decrement = useCallback(() => {
    setCount((prev) => {
      const newValue = prev - 1;
      return min !== undefined ? Math.max(newValue, min) : newValue;
    });
  }, [min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const set = useCallback(
    (value: number) => {
      setCount(() => {
        let newValue = value;
        if (min !== undefined) newValue = Math.max(newValue, min);
        if (max !== undefined) newValue = Math.min(newValue, max);
        return newValue;
      });
    },
    [min, max],
  );

  return { count, increment, decrement, reset, set };
}
