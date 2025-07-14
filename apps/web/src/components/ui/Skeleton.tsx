import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  lines?: number;
}

interface SkeletonComponentProps {
  className?: string;
  height?: string;
  compact?: boolean;
  itemCount?: number;
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
 * Skeleton for metric groups with categories
 */
export const MetricGroupSkeleton: React.FC<{ itemCount?: number }> = ({
  itemCount = 3,
}) => (
  <div className="space-y-3">
    <div className="flex items-center space-x-2">
      <Skeleton width="16px" height="16px" />
      <Skeleton width="140px" height="16px" />
      <Skeleton width="40px" height="20px" rounded />
    </div>
    <div className="ml-6 space-y-2">
      {Array.from({ length: itemCount }).map((_, i) => (
        <MetricItemSkeleton key={i} />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for job list items
 */
export const JobItemSkeleton: React.FC = () => (
  <div className="border-border/50 rounded-xl border-2 p-4">
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
 * Skeleton for job list in sidebar
 */
export const JobListSkeleton: React.FC<{ itemCount?: number }> = ({
  itemCount = 5,
}) => (
  <div className="space-y-2">
    {Array.from({ length: itemCount }).map((_, i) => (
      <JobItemSkeleton key={i} />
    ))}
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

/**
 * Skeleton for dashboard charts
 */
export const ChartSkeleton: React.FC<{ height?: string }> = ({
  height = '200px',
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton width="140px" height="16px" />
      <Skeleton width="80px" height="12px" />
    </div>
    <div className="border-border/50 rounded-lg border p-4">
      <Skeleton width="100%" height={height} />
    </div>
  </div>
);

/**
 * Skeleton for metric cards in dashboard
 */
export const MetricCardSkeleton: React.FC = () => (
  <div className="border-border/50 rounded-lg border p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton width="100px" height="12px" />
        <Skeleton width="80px" height="24px" />
      </div>
      <Skeleton width="40px" height="40px" rounded />
    </div>
  </div>
);

/**
 * Skeleton for unified metrics display
 */
export const UnifiedMetricsSkeleton: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton width="160px" height="20px" />
      <div className="flex space-x-2">
        <Skeleton width="60px" height="28px" rounded />
        <Skeleton width="60px" height="28px" rounded />
      </div>
    </div>
    <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {Array.from({ length: compact ? 6 : 4 }).map((_, i) => (
        <div key={i} className="border-border/50 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton width="90px" height="14px" />
              <Skeleton width="60px" height="12px" />
            </div>
            <Skeleton width="50px" height="16px" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;

/**
 * Skeleton for dashboard page
 */
export const DashboardSkeleton: React.FC = () => (
  <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4">
    <div className="mb-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton width="180px" height="24px" />
        <Skeleton width="120px" height="32px" rounded />
      </div>
    </div>
    <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartSkeleton height="250px" />
      <ChartSkeleton height="250px" />
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartSkeleton height="200px" />
      <ChartSkeleton height="200px" />
    </div>
  </div>
);
