import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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
 * Custom hook for debounced input handling
 * @param initialValue - Initial input value
 * @param delay - Debounce delay in milliseconds
 * @param onDebouncedChange - Callback for debounced value changes
 * @returns Object with current value, debounced value, and setter
 */
export function useDebounceInput(
  initialValue: string,
  delay: number,
  onDebouncedChange: (value: string) => void,
) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    if (debouncedValue !== initialValue) {
      onDebouncedChange(debouncedValue);
    }
  }, [debouncedValue, onDebouncedChange, initialValue]);

  return {
    value,
    debouncedValue,
    setValue,
  };
}
