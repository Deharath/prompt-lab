/**
 * Counter Hook - Numeric state with increment/decrement
 */

import { useState, useCallback } from 'react';

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
