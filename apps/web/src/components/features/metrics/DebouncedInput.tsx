import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce.js';

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  'data-testid'?: string;
  delay?: number;
}

/**
 * Debounced input component that delays triggering onChange until user stops typing
 */
const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value: initialValue,
  onChange,
  placeholder = '',
  className = '',
  id,
  'data-testid': testId,
  delay = 300,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const debouncedValue = useDebounce(inputValue, delay);

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Call onChange when debounced value changes
  useEffect(() => {
    if (debouncedValue !== initialValue) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, initialValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <input
      type="text"
      id={id}
      data-testid={testId}
      className={className}
      placeholder={placeholder}
      value={inputValue}
      onChange={handleChange}
    />
  );
};

export default DebouncedInput;
