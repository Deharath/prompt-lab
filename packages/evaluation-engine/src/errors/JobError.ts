export type ErrorType =
  | 'provider_error'
  | 'timeout'
  | 'validation_error'
  | 'network_error'
  | 'rate_limit'
  | 'unknown';

export interface CategorizedError {
  type: ErrorType;
  message: string;
  retryable: boolean;
  retryDelay?: number; // milliseconds
}

export function categorizeError(error: unknown): CategorizedError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Rate limiting errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      type: 'rate_limit',
      message: errorMessage,
      retryable: true,
      retryDelay: 60000, // 1 minute
    };
  }

  // Network/connection errors
  if (
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('network')
  ) {
    return {
      type: 'network_error',
      message: errorMessage,
      retryable: true,
      retryDelay: 5000, // 5 seconds
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
    return {
      type: 'timeout',
      message: errorMessage,
      retryable: true,
      retryDelay: 2000, // 2 seconds
    };
  }

  // Provider-specific errors
  if (
    errorMessage.includes('API key') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid model') ||
    errorMessage.includes('model not found')
  ) {
    return {
      type: 'provider_error',
      message: errorMessage,
      retryable: false,
    };
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid input') ||
    errorMessage.includes('malformed')
  ) {
    return {
      type: 'validation_error',
      message: errorMessage,
      retryable: false,
    };
  }

  // Default to unknown
  return {
    type: 'unknown',
    message: errorMessage,
    retryable: false,
  };
}

export function shouldRetryError(
  errorType: ErrorType,
  attemptCount: number,
  maxAttempts: number,
): boolean {
  if (attemptCount >= maxAttempts) {
    return false;
  }

  const retryableTypes: ErrorType[] = [
    'network_error',
    'timeout',
    'rate_limit',
  ];
  return retryableTypes.includes(errorType);
}
