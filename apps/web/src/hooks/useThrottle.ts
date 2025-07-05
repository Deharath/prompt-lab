/**
 * Throttled Callback Hook - Throttle function calls
 */

import { useCallback, useRef, useEffect } from 'react';

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
