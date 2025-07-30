/**
 * Performance-optimized hook for metrics display
 * Handles memoization, caching, and state management
 */

import { useMemo, useCallback, useRef } from 'react';
import {
  type MetricResult,
  type ProcessedMetricsResult,
  type MetricProcessingOptions,
  type MetricsViewState,
  MetricCategory,
} from '@prompt-lab/shared-types';
import { processMetricsSync } from '../lib/metrics/processor.js';
import { useStorage } from './useStorage.js';

interface UseMetricsDisplayOptions {
  enableCaching?: boolean;
  cacheTimeout?: number;
  defaultViewState?: Partial<MetricsViewState>;
}

interface UseMetricsDisplayResult {
  processedMetrics: ProcessedMetricsResult;
  viewState: MetricsViewState;
  isLoading: boolean;
  error: Error | null;

  // Actions
  toggleGroupCollapse: (category: MetricCategory) => void;
  setSortBy: (sortBy: 'name' | 'category' | 'value') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleCompactMode: () => void;
  toggleTooltips: () => void;
  resetViewState: () => void;

  // Utilities
  getMetricCount: () => number;
  getErrorCount: () => number;
  hasData: () => boolean;
  getCacheStats: () => { hits: number; misses: number; size: number };
}

// Cache for processed metrics
interface CacheEntry {
  result: ProcessedMetricsResult;
  timestamp: number;
  hash: string;
}

const metricsCache = new Map<string, CacheEntry>();
const cacheStats = { hits: 0, misses: 0 };

/**
 * Generate cache key for metrics data
 */
function generateCacheKey(
  metrics: MetricResult | Record<string, unknown> | null | undefined,
  options: MetricProcessingOptions,
): string {
  // Create a simple hash of the input data
  const dataStr = JSON.stringify({ metrics, options });
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Clean expired cache entries
 */
function cleanCache(timeout: number): void {
  const now = Date.now();
  for (const [key, entry] of metricsCache.entries()) {
    if (now - entry.timestamp > timeout) {
      metricsCache.delete(key);
    }
  }
}

/**
 * Hook for metrics display with performance optimizations
 */
export function useMetricsDisplay(
  metrics: MetricResult | Record<string, unknown> | null | undefined,
  options: UseMetricsDisplayOptions = {},
): UseMetricsDisplayResult {
  const {
    enableCaching = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    defaultViewState = {},
  } = options;

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
      compactMode: false,
      ...defaultViewState,
    },
    {
      serializer: metricsViewStateSerializer,
    },
  );

  // Processing options based on view state
  const processingOptions = useMemo<MetricProcessingOptions>(
    () => ({
      groupByCategory: true,
      sortBy: viewState.sortBy,
      sortOrder: viewState.sortOrder,
      showTooltips: viewState.showTooltips,
    }),
    [viewState.sortBy, viewState.sortOrder, viewState.showTooltips],
  );

  // Error state
  const errorRef = useRef<Error | null>(null);

  // Process metrics with caching and memoization
  const processedMetrics = useMemo<ProcessedMetricsResult>(() => {
    try {
      errorRef.current = null;

      // Generate cache key
      const cacheKey = generateCacheKey(metrics, processingOptions);

      // Check cache if enabled
      if (enableCaching) {
        const cached = metricsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheTimeout) {
          cacheStats.hits++;
          return cached.result;
        }
      }

      // Process metrics
      const result = processMetricsSync(metrics, processingOptions);
      cacheStats.misses++;

      // Cache result if enabled
      if (enableCaching) {
        metricsCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          hash: cacheKey,
        });

        // Clean expired entries periodically
        if (cacheStats.misses % 10 === 0) {
          cleanCache(cacheTimeout);
        }
      }

      return result;
    } catch (error) {
      errorRef.current =
        error instanceof Error ? error : new Error(String(error));
      // Metrics processing error handled by user notification
      return {
        groups: [],
        totalMetrics: 0,
        errorCount: 1,
        hasData: false,
      };
    }
  }, [metrics, processingOptions, enableCaching, cacheTimeout]);

  // Loading state
  const isLoading = useMemo(() => {
    return (
      metrics !== null &&
      metrics !== undefined &&
      !processedMetrics.hasData &&
      !errorRef.current
    );
  }, [metrics, processedMetrics.hasData]);

  // Action: Toggle group collapse
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

  // Action: Set sort by
  const setSortBy = useCallback(
    (sortBy: 'name' | 'category' | 'value') => {
      setViewState((prev: MetricsViewState) => ({ ...prev, sortBy }));
    },
    [setViewState],
  );

  // Action: Set sort order
  const setSortOrder = useCallback(
    (sortOrder: 'asc' | 'desc') => {
      setViewState((prev: MetricsViewState) => ({ ...prev, sortOrder }));
    },
    [setViewState],
  );

  // Action: Toggle compact mode
  const toggleCompactMode = useCallback(() => {
    setViewState((prev: MetricsViewState) => ({
      ...prev,
      compactMode: !prev.compactMode,
    }));
  }, [setViewState]);

  // Action: Toggle tooltips
  const toggleTooltips = useCallback(() => {
    setViewState((prev: MetricsViewState) => ({
      ...prev,
      showTooltips: !prev.showTooltips,
    }));
  }, [setViewState]);

  // Action: Reset view state
  const resetViewState = useCallback(() => {
    setViewState({
      collapsedGroups: new Set(),
      sortBy: 'name',
      sortOrder: 'asc',
      showTooltips: true,
      compactMode: false,
      ...defaultViewState,
    });
  }, [setViewState, defaultViewState]);

  // Utility: Get metric count
  const getMetricCount = useCallback(() => {
    return processedMetrics.totalMetrics;
  }, [processedMetrics.totalMetrics]);

  // Utility: Get error count
  const getErrorCount = useCallback(() => {
    return processedMetrics.errorCount;
  }, [processedMetrics.errorCount]);

  // Utility: Has data
  const hasData = useCallback(() => {
    return processedMetrics.hasData;
  }, [processedMetrics.hasData]);

  // Utility: Get cache stats
  const getCacheStats = useCallback(() => {
    return {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      size: metricsCache.size,
    };
  }, []);

  return {
    processedMetrics,
    viewState,
    isLoading,
    error: errorRef.current,

    // Actions
    toggleGroupCollapse,
    setSortBy,
    setSortOrder,
    toggleCompactMode,
    toggleTooltips,
    resetViewState,

    // Utilities
    getMetricCount,
    getErrorCount,
    hasData,
    getCacheStats,
  };
}

// Export cache utilities for debugging
export const metricsDisplayCache = {
  clear: () => {
    metricsCache.clear();
    cacheStats.hits = 0;
    cacheStats.misses = 0;
  },
  size: () => metricsCache.size,
  stats: () => ({ ...cacheStats }),
};
