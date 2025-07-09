/**
 * Centralized error handling for metrics system
 */

import { MetricError } from '@prompt-lab/shared-types';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
  timestamp?: number;
}

/**
 * Custom error class for metrics-related errors
 */
export class MetricsError extends Error {
  public readonly type: ErrorType;
  public readonly originalError?: Error;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'MetricsError';
    this.type = details.type;
    this.originalError = details.originalError;
    this.context = details.context;
    this.timestamp = details.timestamp || Date.now();
  }

  public toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Error handler for metric calculations
 */
export class MetricsErrorHandler {
  private errors: MetricError[] = [];

  /**
   * Handle a metric calculation error
   */
  public handleError(
    metricId: string,
    error: Error | string,
    fallbackValue?: unknown,
    context?: Record<string, unknown>,
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType = this.categorizeError(error);

    const metricError: MetricError = {
      metricId,
      error: errorMessage,
      fallbackValue,
    };

    this.errors.push(metricError);

    // Log the error with context
    this.logError(metricId, errorType, errorMessage, context);
  }

  /**
   * Get all accumulated errors
   */
  public getErrors(): MetricError[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Check if there are any errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get errors for a specific metric
   */
  public getErrorsForMetric(metricId: string): MetricError[] {
    return this.errors.filter((error) => error.metricId === metricId);
  }

  /**
   * Categorize error type based on error instance or message
   */
  private categorizeError(error: Error | string): ErrorType {
    if (typeof error === 'string') {
      if (error.includes('validation')) return ErrorType.VALIDATION_ERROR;
      if (error.includes('timeout')) return ErrorType.TIMEOUT_ERROR;
      if (error.includes('network')) return ErrorType.NETWORK_ERROR;
      return ErrorType.UNKNOWN_ERROR;
    }

    // Check error types
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return ErrorType.VALIDATION_ERROR;
    }
    if (error.name === 'TimeoutError') {
      return ErrorType.TIMEOUT_ERROR;
    }
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (error.message.includes('cache')) {
      return ErrorType.CACHE_ERROR;
    }

    return ErrorType.CALCULATION_ERROR;
  }

  /**
   * Log error with appropriate level and context
   */
  private logError(
    metricId: string,
    errorType: ErrorType,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const logData = {
      metricId,
      errorType,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    // Use different log levels based on error type
    switch (errorType) {
      case ErrorType.VALIDATION_ERROR:
        console.warn('Metric validation error:', logData);
        break;
      case ErrorType.TIMEOUT_ERROR:
      case ErrorType.NETWORK_ERROR:
        console.error('Metric infrastructure error:', logData);
        break;
      case ErrorType.CACHE_ERROR:
        console.warn('Metric cache error:', logData);
        break;
      default:
        console.error('Metric calculation error:', logData);
    }
  }
}

/**
 * Global error handler instance
 */
export const metricsErrorHandler = new MetricsErrorHandler();

/**
 * Utility function for safe metric calculation with error handling
 */
export function safeMetricCalculation<T>(
  metricId: string,
  calculator: () => T,
  fallbackValue: T,
  context?: Record<string, unknown>,
): T {
  try {
    return calculator();
  } catch (error) {
    metricsErrorHandler.handleError(
      metricId,
      error instanceof Error ? error : new Error(String(error)),
      fallbackValue,
      context,
    );
    return fallbackValue;
  }
}

/**
 * Async version of safe metric calculation
 */
export async function safeAsyncMetricCalculation<T>(
  metricId: string,
  calculator: () => Promise<T>,
  fallbackValue: T,
  context?: Record<string, unknown>,
): Promise<T> {
  try {
    return await calculator();
  } catch (error) {
    metricsErrorHandler.handleError(
      metricId,
      error instanceof Error ? error : new Error(String(error)),
      fallbackValue,
      context,
    );
    return fallbackValue;
  }
}

/**
 * Validation utilities
 */
export function validateMetricInput(
  metricId: string,
  input: unknown,
  required: boolean = false,
): void {
  if (required && (input === null || input === undefined)) {
    throw new MetricsError({
      type: ErrorType.VALIDATION_ERROR,
      message: `Required input missing for metric ${metricId}`,
      context: { metricId, input },
    });
  }

  if (input !== null && input !== undefined && typeof input !== 'string') {
    throw new MetricsError({
      type: ErrorType.VALIDATION_ERROR,
      message: `Invalid input type for metric ${metricId}. Expected string, got ${typeof input}`,
      context: { metricId, input, inputType: typeof input },
    });
  }
}

/**
 * Validate text input for metrics
 */
export function validateTextInput(text: string, metricId: string): void {
  if (typeof text !== 'string') {
    throw new MetricsError({
      type: ErrorType.VALIDATION_ERROR,
      message: `Invalid text input for metric ${metricId}. Expected string, got ${typeof text}`,
      context: { metricId, textType: typeof text },
    });
  }

  if (text.length === 0) {
    throw new MetricsError({
      type: ErrorType.VALIDATION_ERROR,
      message: `Empty text input for metric ${metricId}`,
      context: { metricId },
    });
  }
}
