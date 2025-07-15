export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STREAMING_ERROR = 'STREAMING_ERROR',
  CANCELLATION_ERROR = 'CANCELLATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
}

export const createError = (
  type: ErrorType,
  message: string,
  originalError?: Error,
  retryable: boolean = true,
): AppError => ({
  type,
  message,
  originalError,
  retryable,
});

export const isNetworkError = (error: Error): boolean => {
  return (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('connection')
  );
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};
