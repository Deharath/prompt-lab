import { ReactNode } from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'avatar' | 'card' | 'button';
  lines?: number;
}

interface LoadingStateProps {
  loading: boolean;
  children: ReactNode;
  skeleton?: ReactNode;
  fallback?: ReactNode;
}

// Skeleton component for loading states
export const LoadingSkeleton = ({
  className = '',
  variant = 'text',
  lines = 1,
}: LoadingSkeletonProps) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const variantClasses = {
    text: 'h-4',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-32',
    button: 'h-10',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

// Wrapper component that shows skeleton while loading
export const LoadingState = ({
  loading,
  children,
  skeleton,
  fallback,
}: LoadingStateProps) => {
  if (loading) {
    return skeleton || fallback || <LoadingSkeleton />;
  }

  return <>{children}</>;
};

// Specific loading components for common use cases
export const LoadingSpinner = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center">
      <svg
        className={`${sizeClasses[size]} animate-spin text-gray-500`}
        fill="none"
        viewBox="0 0 24 24"
      >
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
    </div>
  );
};

export const LoadingDots = () => (
  <div className="flex justify-center space-x-1">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="h-2 w-2 animate-pulse rounded-full bg-gray-500"
        style={{ animationDelay: `${i * 150}ms` }}
      />
    ))}
  </div>
);

export default LoadingState;
