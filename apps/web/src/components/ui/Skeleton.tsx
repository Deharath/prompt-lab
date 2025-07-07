import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  lines?: number;
}

/**
 * Skeleton loading component for better perceived performance
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = false,
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-muted/60 dark:bg-muted/40';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';

  const style = {
    width: width || '100%',
    height: height || '1rem',
  };

  if (lines === 1) {
    return (
      <div
        className={`${baseClasses} ${roundedClasses} ${className}`}
        style={style}
        role="status"
        aria-label="Loading..."
      />
    );
  }

  return (
    <div
      className={`space-y-2 ${className}`}
      role="status"
      aria-label="Loading..."
    >
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${roundedClasses}`}
          style={{
            ...style,
            width: index === lines - 1 ? '75%' : width || '100%',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton for metric items
 */
export const MetricItemSkeleton: React.FC = () => (
  <div className="border-border/50 flex items-center justify-between rounded-md border p-3">
    <div className="flex flex-col space-y-1">
      <Skeleton width="120px" height="16px" />
      <Skeleton width="80px" height="12px" />
    </div>
    <Skeleton width="60px" height="16px" />
  </div>
);

/**
 * Skeleton for job list items
 */
export const JobItemSkeleton: React.FC = () => (
  <div className="border-border/50 rounded-lg border p-4">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton width="200px" height="16px" />
        <Skeleton width="150px" height="14px" />
        <Skeleton width="100px" height="12px" />
      </div>
      <Skeleton width="80px" height="24px" rounded />
    </div>
  </div>
);

/**
 * Skeleton for the results panel
 */
export const ResultsPanelSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton width="120px" height="20px" />
      <Skeleton width="60px" height="16px" />
    </div>
    <div className="space-y-3">
      <MetricItemSkeleton />
      <MetricItemSkeleton />
      <MetricItemSkeleton />
      <MetricItemSkeleton />
    </div>
  </div>
);

export default Skeleton;
