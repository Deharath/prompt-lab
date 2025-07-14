/**
 * Unified Metrics Display Component
 * Ultra-compact, space-efficient metrics display with fixed button functionality
 */

import React, { memo, useMemo, useCallback, useState } from 'react';
import {
  type MetricResult,
  type MetricGroup,
  type ProcessedMetricsResult,
  type MetricsViewState,
  MetricCategory,
} from '@prompt-lab/shared-types';
import {
  processMetrics,
  hasThresholdViolation,
} from '../../../lib/metrics/processor.js';
import { useStorage } from '../../../hooks/useStorage.js';
import { UnifiedMetricsSkeleton } from '../../ui/Skeleton.js';

interface UnifiedMetricsDisplayProps {
  metrics: MetricResult | Record<string, unknown> | null | undefined;
  title?: string;
  compact?: boolean;
  showCategories?: boolean;
  showTooltips?: boolean;
  className?: string;
  'data-testid'?: string;
}

const UnifiedMetricsDisplay = memo<UnifiedMetricsDisplayProps>(
  ({
    metrics,
    title = 'Evaluation Results',
    compact = false,
    showCategories = true,
    showTooltips = true,
    className = '',
    'data-testid': testId,
  }) => {
    // Custom serializer to handle Set objects properly
    const metricsViewStateSerializer = {
      stringify: (value: MetricsViewState) => {
        return JSON.stringify({
          ...value,
          collapsedGroups: Array.from(value.collapsedGroups),
        });
      },
      parse: (value: string) => {
        const parsed = JSON.parse(value);
        return {
          ...parsed,
          collapsedGroups: new Set(parsed.collapsedGroups || []),
        };
      },
    };

    // Persistent view state with custom serializer
    const [viewState, setViewState] = useStorage<MetricsViewState>(
      'metrics-view-state',
      {
        collapsedGroups: new Set(),
        sortBy: 'name',
        sortOrder: 'asc',
        showTooltips: true,
        compactMode: true, // Default to compact for better space usage
      },
      {
        serializer: metricsViewStateSerializer,
      },
    );

    // Process metrics with memoization for performance
    const processedMetrics = useMemo<ProcessedMetricsResult>(() => {
      if (!metrics || (Array.isArray(metrics) && metrics.length === 0)) {
        return { groups: [], hasData: false, errorCount: 0, totalMetrics: 0 };
      }
      return processMetrics(metrics, {
        groupByCategory: showCategories,
        sortBy: viewState.sortBy,
        sortOrder: viewState.sortOrder,
        showTooltips,
      });
    }, [
      metrics,
      showCategories,
      viewState.sortBy,
      viewState.sortOrder,
      showTooltips,
    ]);

    // Toggle group collapse state
    const toggleGroupCollapse = useCallback(
      (category: MetricCategory) => {
        setViewState((prev: MetricsViewState) => {
          const newCollapsed = new Set(prev.collapsedGroups);
          if (newCollapsed.has(category)) {
            newCollapsed.delete(category);
          } else {
            newCollapsed.add(category);
          }
          return { ...prev, collapsedGroups: newCollapsed };
        });
      },
      [setViewState],
    );

    // Format metric values - now relies on processor for proper formatting
    const formatMetricValue = useCallback((item: any) => {
      // The processor should handle all formatting, just return the processed value
      return item.value;
    }, []);

    // Enhanced tooltip component for mobile and desktop
    const MetricTooltip = ({
      content,
      children,
    }: {
      content: string;
      children: React.ReactNode;
    }) => {
      const [isVisible, setIsVisible] = useState(false);

      return (
        <div className="relative inline-block">
          <div
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onTouchStart={() => setIsVisible(true)}
            onTouchEnd={() => setIsVisible(false)}
            className="cursor-help"
          >
            {children}
          </div>
          {isVisible && (
            <div className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 transform">
              <div className="bg-popover text-popover-foreground border-border rounded-lg border p-3 shadow-lg">
                <p className="text-sm leading-relaxed">{content}</p>
              </div>
            </div>
          )}
        </div>
      );
    };

    // Loading state when metrics are undefined or empty
    if (
      !metrics ||
      (Array.isArray(metrics) && metrics.length === 0) ||
      !processedMetrics.hasData
    ) {
      return (
        <div className={`${className}`} data-testid={testId}>
          <UnifiedMetricsSkeleton compact={compact} />
        </div>
      );
    }

    return (
      <div className={`${className}`} data-testid={testId}>
        {/* Dynamic header with enhanced controls */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {/* View controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                setViewState((prev) => ({
                  ...prev,
                  sortBy: prev.sortBy === 'name' ? 'value' : 'name',
                }))
              }
              className="text-muted-foreground hover:text-foreground button-press rounded-md px-2 py-1 text-sm transition-colors"
            >
              Sort by {viewState.sortBy === 'name' ? 'Value' : 'Name'}
            </button>
            <button
              onClick={() =>
                setViewState((prev) => ({
                  ...prev,
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
                }))
              }
              className="text-muted-foreground hover:text-foreground button-press rounded-md px-2 py-1 text-sm transition-colors"
            >
              {viewState.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Metrics display */}
        <div className="space-y-4">
          {processedMetrics.groups.map((group) => (
            <div key={group.category} className="space-y-2">
              {showCategories && (
                <button
                  onClick={() => toggleGroupCollapse(group.category)}
                  className="hover:bg-muted button-press flex w-full items-center justify-between rounded-md p-2 text-left transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {group.category}
                    </span>
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                      {group.items.length}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {viewState.collapsedGroups.has(group.category) ? '▶' : '▼'}
                  </span>
                </button>
              )}

              {!viewState.collapsedGroups.has(group.category) && (
                <div
                  className={`grid gap-2 ${
                    compact ? 'grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {group.items.map((item, index) => (
                    <div
                      key={
                        (item as any)?.id ||
                        (item as any)?.name ||
                        `item-${group.category}-${index}`
                      }
                      className="border-border/50 hover:bg-muted/50 metric-card-hover rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="truncate text-sm font-medium">
                              {(item as any)?.name ||
                                (item as any)?.id ||
                                'Unknown Metric'}
                            </span>
                            {(item as any)?.description && showTooltips && (
                              <MetricTooltip
                                content={(item as any).description}
                              >
                                <span className="text-muted-foreground cursor-help">
                                  ⓘ
                                </span>
                              </MetricTooltip>
                            )}
                          </div>
                          {(item as any)?.subtitle && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {(item as any).subtitle}
                            </p>
                          )}
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <span className="text-sm font-semibold">
                            {formatMetricValue(item)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for performance optimization
    return (
      prevProps.metrics === nextProps.metrics &&
      prevProps.title === nextProps.title &&
      prevProps.compact === nextProps.compact &&
      prevProps.showCategories === nextProps.showCategories &&
      prevProps.showTooltips === nextProps.showTooltips &&
      prevProps.className === nextProps.className
    );
  },
);

export default UnifiedMetricsDisplay;
