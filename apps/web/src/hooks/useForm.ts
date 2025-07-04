/**
 * Form Management Hook - Comprehensive form state and validation
 *
 * This hook provides a complete solution for form management with:
 * - Field-level validation
 * - Form-level validation
 * - Touch tracking
 * - Submission handling
 * - Reset functionality
 * - Accessibility features
 */

import React from 'react';
import { useState, useCallback, useMemo } from 'react';
import type { FormState, Validator } from '../types/global.js';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: Record<string, Validator<unknown>>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormReturn<T> extends FormState<T> {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  clearError: <K extends keyof T>(field: K) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateForm: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (newValues?: Partial<T>) => void;
  getFieldProps: <K extends keyof T>(
    field: K,
  ) => {
    value: T[K];
    onChange: (value: T[K]) => void;
    onBlur: () => void;
    error: string;
    touched: boolean;
    'aria-invalid': boolean;
    'aria-describedby': string;
  };
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>,
): UseFormReturn<T> {
  const {
    initialValues,
    validationSchema = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  // Initialize state
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<Record<keyof T, string>>(
    {} as Record<keyof T, string>,
  );
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>(
    {} as Record<keyof T, boolean>,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed values
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Field validation
  const validateField = useCallback(
    <K extends keyof T>(field: K): boolean => {
      const fieldName = String(field);
      const validator = validationSchema[fieldName];
      if (!validator) return true;

      const result = validator(values[field]);

      if (result.isValid) {
        setErrorsState((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      } else {
        setErrorsState((prev) => ({
          ...prev,
          [field]: result.error || 'Invalid value',
        }));
        return false;
      }
    },
    [values, validationSchema],
  );

  // Form validation
  const validateForm = useCallback((): boolean => {
    let isFormValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    Object.keys(validationSchema).forEach((fieldKey) => {
      const field = fieldKey as keyof T;
      const validator = validationSchema[fieldKey];

      if (validator && field in values) {
        const result = validator(values[field]);
        if (!result.isValid) {
          newErrors[field] = result.error || 'Invalid value';
          isFormValid = false;
        }
      }
    });

    setErrorsState(newErrors as Record<keyof T, string>);
    return isFormValid;
  }, [values, validationSchema]);

  // Value setters
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValuesState((prev) => ({ ...prev, [field]: value }));

      if (validateOnChange) {
        // Validate after state update
        setTimeout(() => validateField(field), 0);
      }
    },
    [validateField, validateOnChange],
  );

  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setValuesState((prev) => ({ ...prev, ...newValues }));

      if (validateOnChange) {
        // Validate changed fields
        setTimeout(() => {
          Object.keys(newValues).forEach((field) => {
            validateField(field as keyof T);
          });
        }, 0);
      }
    },
    [validateField, validateOnChange],
  );

  // Error setters
  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrorsState((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback(<K extends keyof T>(field: K) => {
    setErrorsState((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Touch handlers
  const setFieldTouched = useCallback(
    <K extends keyof T>(field: K, touched = true) => {
      setTouchedState((prev) => ({ ...prev, [field]: touched }));

      if (touched && validateOnBlur) {
        validateField(field);
      }
    },
    [validateField, validateOnBlur],
  );

  // Form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(initialValues).reduce(
        (acc, key) => {
          acc[key as keyof T] = true;
          return acc;
        },
        {} as Record<keyof T, boolean>,
      );
      setTouchedState(allTouched);

      // Validate form
      const isFormValid = validateForm();

      if (isFormValid && onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateForm, onSubmit, initialValues],
  );

  // Reset form
  const reset = useCallback(
    (newValues?: Partial<T>) => {
      const resetValues = { ...initialValues, ...newValues };
      setValuesState(resetValues);
      setErrorsState({} as Record<keyof T, string>);
      setTouchedState({} as Record<keyof T, boolean>);
      setIsSubmitting(false);
    },
    [initialValues],
  );

  // Field props helper
  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => {
      const fieldError = errors[field] || '';
      const fieldTouched = touched[field] || false;

      return {
        value: values[field],
        onChange: (value: T[K]) => setValue(field, value),
        onBlur: () => setFieldTouched(field, true),
        error: fieldError,
        touched: fieldTouched,
        'aria-invalid': Boolean(fieldError),
        'aria-describedby': `${String(field)}-error`,
      };
    },
    [values, errors, touched, setValue, setFieldTouched],
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setValues,
    setError,
    clearError,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
  };
}

// Common validators
export const validators = {
  required: <T>(value: T): { isValid: boolean; error?: string } => ({
    isValid: Boolean(value && String(value).trim()),
    error: 'This field is required',
  }),

  email: (value: string): { isValid: boolean; error?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: !value || emailRegex.test(value),
      error: 'Please enter a valid email address',
    };
  },

  minLength:
    (min: number) =>
    (value: string): { isValid: boolean; error?: string } => ({
      isValid: !value || value.length >= min,
      error: `Must be at least ${min} characters`,
    }),

  maxLength:
    (max: number) =>
    (value: string): { isValid: boolean; error?: string } => ({
      isValid: !value || value.length <= max,
      error: `Must be no more than ${max} characters`,
    }),

  pattern:
    (regex: RegExp, message: string) =>
    (value: string): { isValid: boolean; error?: string } => ({
      isValid: !value || regex.test(value),
      error: message,
    }),
};
