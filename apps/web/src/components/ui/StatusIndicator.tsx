import { ReactNode } from 'react';

type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';
type StatusSize = 'sm' | 'md' | 'lg';

interface StatusIndicatorProps {
  variant: StatusVariant;
  size?: StatusSize;
  children?: ReactNode;
  pulse?: boolean;
  icon?: ReactNode;
}

const StatusIndicator = ({
  variant,
  size = 'md',
  children,
  pulse = false,
  icon,
}: StatusIndicatorProps) => {
  const baseClasses = 'inline-flex items-center gap-2 font-medium rounded-lg';

  const variantClasses = {
    success:
      'text-green-700 bg-green-50 border border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800',
    error:
      'text-red-700 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
    warning:
      'text-yellow-700 bg-yellow-50 border border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800',
    info: 'text-blue-700 bg-blue-50 border border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800',
    loading:
      'text-gray-700 bg-gray-50 border border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const pulseClass = pulse ? 'animate-pulse' : '';

  // Default icons for each variant
  const defaultIcons = {
    success: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    loading: (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${pulseClass}
      `}
      role="status"
      aria-live="polite"
    >
      {icon || defaultIcons[variant]}
      {children && <span>{children}</span>}
    </div>
  );
};

export default StatusIndicator;
