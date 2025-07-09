/**
 * Caching service for metric results to improve performance
 */

import NodeCache from 'node-cache';
import { createHash } from 'crypto';
import {
  MetricInput,
  MetricsCalculationResult,
} from '@prompt-lab/shared-types';

// Create cache instance with 15 minute TTL and 5 minute check period
const cache = new NodeCache({
  stdTTL: 15 * 60, // 15 minutes
  checkperiod: 5 * 60, // 5 minutes
  useClones: false, // Don't clone objects for better performance
});

/**
 * Generate a cache key for the given parameters
 */
function generateCacheKey(
  text: string,
  selectedMetrics: MetricInput[],
  disabledMetrics: Set<string>,
  referenceText?: string,
): string {
  const textHash = createHash('sha256')
    .update(text)
    .digest('hex')
    .substring(0, 16);
  const metricsHash = createHash('sha256')
    .update(
      JSON.stringify(selectedMetrics.sort((a, b) => a.id.localeCompare(b.id))),
    )
    .digest('hex')
    .substring(0, 16);

  const disabledHash = createHash('sha256')
    .update(JSON.stringify(Array.from(disabledMetrics).sort()))
    .digest('hex')
    .substring(0, 8);

  const refHash = referenceText
    ? createHash('sha256').update(referenceText).digest('hex').substring(0, 8)
    : 'none';

  return `metrics:${textHash}:${metricsHash}:${disabledHash}:${refHash}`;
}

/**
 * Get cached metric results
 */
export function getCachedMetrics(
  text: string,
  selectedMetrics: MetricInput[],
  disabledMetrics: Set<string>,
  referenceText?: string,
): MetricsCalculationResult | undefined {
  const cacheKey = generateCacheKey(
    text,
    selectedMetrics,
    disabledMetrics,
    referenceText,
  );
  return cache.get<MetricsCalculationResult>(cacheKey);
}

/**
 * Cache metric results
 */
export function cacheMetrics(
  text: string,
  selectedMetrics: MetricInput[],
  disabledMetrics: Set<string>,
  result: MetricsCalculationResult,
  referenceText?: string,
): void {
  const cacheKey = generateCacheKey(
    text,
    selectedMetrics,
    disabledMetrics,
    referenceText,
  );
  cache.set(cacheKey, result);
}

/**
 * Clear all cached metrics
 */
export function clearMetricsCache(): void {
  cache.flushAll();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats();
}

/**
 * Get cache size information
 */
export function getCacheInfo() {
  return {
    keys: cache.keys().length,
    stats: cache.getStats(),
  };
}
