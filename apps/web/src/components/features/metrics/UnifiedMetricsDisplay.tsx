/**
 * Unified Metrics Display Component
 * Ultra-compact, space-efficient metrics display with fixed button functionality
 */

import React, { useState, useMemo, useCallback } from 'react';
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

interface UnifiedMetricsDisplayProps {
  metrics: MetricResult | Record<string, unknown> | null | undefined;
  title?: string;
  compact?: boolean;
  showCategories?: boolean;
  showTooltips?: boolean;
  className?: string;
  'data-testid'?: string;
}

const UnifiedMetricsDisplay: React.FC<UnifiedMetricsDisplayProps> = ({
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
          onClick={() => setIsVisible(!isVisible)}
          onFocus={() => setIsVisible(true)}
          onBlur={() => setIsVisible(false)}
          role="button"
          tabIndex={0}
          aria-label={content}
          className="cursor-pointer"
        >
          {children}
        </div>

        {isVisible && (
          <div
            className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[200px] -translate-x-1/2 transform rounded bg-gray-900 px-3 py-1.5 text-left text-xs text-white shadow-lg"
            role="tooltip"
          >
            <div className="break-words">{content}</div>
            <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    );
  };

  // Render individual metric item with cleaned up styling
  const renderMetricItem = useCallback(
    (item: any, index: number) => {
      const isCompact = compact || viewState.compactMode;
      const displayValue = formatMetricValue(item);

      return (
        <div
          key={item.id}
          className={`border-border bg-card hover:bg-muted/30 relative rounded-lg border transition-colors duration-200 ${
            isCompact ? 'p-3' : 'p-4'
          } ${item.colSpan === 2 ? 'col-span-2' : ''}`}
          role="listitem"
          aria-label={`${item.name}: ${displayValue}${item.unit ? ` ${item.unit}` : ''}`}
        >
          {/* Error indicator */}
          {item.hasError && (
            <div
              className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:bg-red-400 dark:ring-gray-900"
              aria-label="Error in metric calculation"
              title={item.errorMessage || 'Error in metric calculation'}
            />
          )}

          {/* Main content area with vertical layout for better text fitting */}
          <div className="space-y-2">
            {/* Header with name and tooltip icon */}
            <div className="flex items-center gap-2">
              <h4
                className={`font-medium ${isCompact ? 'text-sm' : 'text-base'} flex-1 leading-tight`}
              >
                {item.name}
              </h4>
              {item.description && (
                <MetricTooltip content={item.description}>
                  <svg
                    className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </MetricTooltip>
              )}
            </div>

            {/* Value display - full width for better readability */}
            <div className="w-full">
              <div
                className={`font-semibold ${isCompact ? 'text-sm' : 'text-lg'} text-foreground break-words`}
              >
                {displayValue}
                {item.unit && (
                  <span className="ml-1 text-sm font-normal opacity-75">
                    {item.unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    },
    [compact, viewState.compactMode, formatMetricValue],
  );

  // Render metric group with ultra-compact design
  const renderMetricGroup = useCallback(
    (group: MetricGroup, groupIndex: number) => {
      const isCollapsed = viewState.collapsedGroups.has(group.category);
      const hasErrors = group.hasErrors;
      const isCompact = compact || viewState.compactMode;

      return (
        <div
          key={group.category}
          className="border-border bg-card dark:bg-card overflow-hidden rounded-lg border"
          role="region"
          aria-labelledby={`group-${group.category}-title`}
        >
          {/* Group header with better visual hierarchy */}
          <button
            onClick={() => toggleGroupCollapse(group.category)}
            className={`bg-muted/20 dark:bg-muted/10 hover:bg-muted/30 dark:hover:bg-muted/20 w-full px-4 py-3 text-left transition-colors duration-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none ${hasErrors ? 'border-l-4 border-red-500 dark:border-red-400' : ''}`}
            aria-expanded={!isCollapsed}
            aria-controls={`group-${group.category}-content`}
            id={`group-${group.category}-title`}
          >
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <h3 className="text-foreground text-base font-semibold">
                  {group.title}
                </h3>
                {hasErrors && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
                    aria-label="Contains errors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                    Error
                  </span>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span className="text-muted-foreground text-sm font-medium">
                  {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>

          {/* Group content with proper collapse animation */}
          {!isCollapsed && (
            <div
              id={`group-${group.category}-content`}
              className="animate-in slide-in-from-top-1 duration-200"
              aria-hidden={isCollapsed}
            >
              <div className="p-4">
                <div
                  className={`grid gap-3 ${
                    isCompact
                      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1 lg:grid-cols-2'
                  }`}
                  role="list"
                  aria-label={`${group.title} results`}
                >
                  {group.items.map(renderMetricItem)}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    },
    [
      viewState.collapsedGroups,
      viewState.compactMode,
      compact,
      toggleGroupCollapse,
      renderMetricItem,
    ],
  );

  // Loading state
  if (!processedMetrics.hasData) {
    return (
      <div
        className={`py-6 text-center ${className}`}
        data-testid={testId}
        role="status"
        aria-live="polite"
      >
        <div className="text-muted-foreground text-sm">
          {metrics === null || metrics === undefined
            ? 'No results available'
            : 'Processing...'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 ${className}`}
      data-testid={testId}
      role="main"
      aria-label={title}
    >
      {/* Header with improved controls */}
      <div className="border-border flex items-center justify-between border-b pb-2">
        <h2 className="text-foreground text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-3">
          {/* View toggle - fixed button text */}
          <button
            onClick={() => {
              setViewState((prev: MetricsViewState) => ({
                ...prev,
                compactMode: !prev.compactMode,
              }));
            }}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              viewState.compactMode
                ? 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            }`}
            aria-pressed={!viewState.compactMode}
            title={
              viewState.compactMode
                ? 'Switch to expanded view'
                : 'Switch to compact view'
            }
          >
            {viewState.compactMode ? '📐 Expanded' : '📏 Compact'}
          </button>

          {/* Error indicator */}
          {processedMetrics.errorCount > 0 && (
            <span
              className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
              role="alert"
            >
              ⚠️ {processedMetrics.errorCount} error
              {processedMetrics.errorCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Metrics groups with proper spacing */}
      <div className="space-y-4" role="presentation">
        {processedMetrics.groups.map(renderMetricGroup)}
      </div>
    </div>
  );
};

export default UnifiedMetricsDisplay;
