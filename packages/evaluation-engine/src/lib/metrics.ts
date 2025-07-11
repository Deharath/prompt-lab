/**
 * Task 11 - Backend Metric Calculation
 * New metric calculation functions to replace DIY metrics
 * Implements Tasks 2-5 functionality
 */

import { MetricRegistry } from '../metrics/registry.js';
import { textWorker } from './textWorker.js';
import { calculateReadabilityScores } from './readabilityService.js';
import { analyzeSentiment, type SentimentScore } from './sentimentService.js';
import { recordLatency } from './latencyLogger.js';
import {
  calculateKeywordMetrics,
  type KeywordWeight,
} from './keywordMetrics.js';
import {
  calculatePrecision,
  calculateRecall,
  calculateFScore,
  calculateVocabularyDiversity,
  calculateCompletenessScore,
  calculateBleuScore,
  calculateRougeScores,
} from './metricCalculators.js';
import {
  type MetricInput,
  type MetricResult,
  type MetricsCalculationResult,
  type MetricError,
  type MetricContext,
  type SentimentResult,
  type DetailedSentimentResult,
  type KeywordResult,
} from '@prompt-lab/shared-types';
import { getCachedMetrics, cacheMetrics } from './metricsCache.js';
import {
  calculateQualityMetrics,
  calculateTextComplexity,
  validateJsonString,
  safeCalculateMetric,
  type TextStatistics,
} from './metricCalculators.js';
import {
  MetricsErrorHandler,
  safeMetricCalculation,
  safeAsyncMetricCalculation,
  validateTextInput,
  validateMetricInput,
} from './errorHandling.js';

/**
 * Main metrics calculation function that replaces the DIY implementation
 */
export async function calculateMetrics(
  text: string,
  selectedMetrics: MetricInput[],
  disabledMetrics: Set<string> = new Set(),
  referenceText?: string,
): Promise<MetricsCalculationResult> {
  const startTime = performance.now();
  const errorHandler = new MetricsErrorHandler();

  // Validate inputs
  try {
    validateTextInput(text, 'calculateMetrics');
  } catch (error) {
    return {
      results: {},
      errors: [
        {
          metricId: 'validation',
          error: error instanceof Error ? error.message : String(error),
        },
      ],
      processingTime: performance.now() - startTime,
    };
  }

  if (!selectedMetrics || selectedMetrics.length === 0) {
    return {
      results: {},
      errors: [],
      processingTime: performance.now() - startTime,
    };
  }

  // Check cache first
  const cachedResult = getCachedMetrics(
    text,
    selectedMetrics,
    disabledMetrics,
    referenceText,
  );
  if (cachedResult) {
    const cacheProcessingTime = performance.now() - startTime;

    // Record cache hit latency
    recordLatency('metrics_calculation', cacheProcessingTime, {
      metricCount: selectedMetrics.length,
      textLength: text.length,
      cacheHit: true,
    });

    return {
      ...cachedResult,
      processingTime: cacheProcessingTime,
    };
  }

  const results: MetricResult = {};

  // Sort metrics by dependencies (for future use)
  const sortedMetrics = resolveDependencies(selectedMetrics);

  // Calculate metrics using plugin system
  for (const metric of sortedMetrics) {
    // Skip disabled metrics
    if (disabledMetrics.has(metric.id)) {
      continue;
    }

    try {
      const plugin = MetricRegistry.get(metric.id);
      if (!plugin) {
        // Unknown metric - skip silently for backward compatibility
        continue;
      }

      // Validate input if required
      // Note: Let plugins handle their own validation and error cases
      // if (
      //   plugin.requiresInput &&
      //   plugin.validate &&
      //   !plugin.validate(metric.input)
      // ) {
      //   continue; // Skip invalid metrics silently
      // }

      // Determine input for calculation
      let input = metric.input;
      if (!input && plugin.requiresInput && referenceText) {
        input = referenceText; // Auto-use reference text
      }

      // Calculate metric with context
      const context = {
        text,
        selectedMetrics,
        disabledMetrics,
        referenceText,
        responseLatency: (results as any).response_latency, // For performance metrics
      };

      const result = await plugin.calculate(text, input, context);

      if (result !== undefined) {
        (results as any)[metric.id] = result;
      }
    } catch (error) {
      // Use centralized error handling
      errorHandler.handleError(
        metric.id,
        error instanceof Error ? error : new Error(String(error)),
        null,
        { text: text.substring(0, 100), metricInput: metric.input },
      );
    }
  }

  const processingTime = performance.now() - startTime;

  // Record latency measurement
  recordLatency('metrics_calculation', processingTime, {
    metricCount: selectedMetrics.length,
    textLength: text.length,
    cacheHit: false,
  });

  const result: MetricsCalculationResult = {
    results,
    errors: errorHandler.getErrors(),
    processingTime,
  };

  // Cache the result for future use
  cacheMetrics(text, selectedMetrics, disabledMetrics, result, referenceText);

  return result;
}

/**
 * Resolve dependencies between metrics using topological sort
 */
function resolveDependencies(metrics: MetricInput[]): MetricInput[] {
  const sorted: MetricInput[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(metricInput: MetricInput) {
    if (visiting.has(metricInput.id)) {
      throw new Error(
        `Circular dependency detected for metric: ${metricInput.id}`,
      );
    }
    if (visited.has(metricInput.id)) return;

    visiting.add(metricInput.id);

    const plugin = MetricRegistry.get(metricInput.id);
    if (plugin?.dependencies) {
      for (const depId of plugin.dependencies) {
        const depMetric = metrics.find((m) => m.id === depId);
        if (depMetric) visit(depMetric);
      }
    }

    visiting.delete(metricInput.id);
    visited.add(metricInput.id);
    sorted.push(metricInput);
  }

  metrics.forEach(visit);
  return sorted;
}

/**
 * Helper function to parse keywords from metric input
 */
export function parseKeywords(input: string): string[] {
  try {
    // Try to parse as JSON array first
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.filter((k) => typeof k === 'string');
    } else if (typeof parsed === 'string') {
      return [parsed];
    }
  } catch {
    // If not JSON, treat as comma-separated
  }

  // Parse as comma-separated keywords
  return input
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/**
 * Get available metric definitions
 */
export function getAvailableMetrics(): Array<{
  id: string;
  name: string;
  description: string;
  requiresInput?: boolean;
}> {
  return MetricRegistry.getAll().map((plugin) => ({
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    requiresInput: plugin.requiresInput,
  }));
}

// Re-export types for better TypeScript resolution
export type {
  MetricInput,
  MetricResult,
  MetricsCalculationResult,
  MetricError,
  MetricContext,
  SentimentResult,
  DetailedSentimentResult,
  KeywordResult,
} from '@prompt-lab/shared-types';
