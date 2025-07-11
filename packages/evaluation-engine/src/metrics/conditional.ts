import type { MetricInput, MetricContext } from '@prompt-lab/shared-types';
import { MetricRegistry } from './registry.js';

/**
 * Conditional metrics that are auto-included based on context
 */
export class ConditionalMetrics {
  /**
   * Get metrics that should be conditionally included based on context
   */
  static getConditionalMetrics(context: MetricContext): MetricInput[] {
    const conditionalMetrics: MetricInput[] = [];

    // Auto-include similarity metrics when input data exists for comparison
    if (context.referenceText || context.inputData) {
      const similarityMetrics = ['bleu_score', 'rouge_1', 'rouge_2', 'rouge_l'];

      for (const metricId of similarityMetrics) {
        const plugin = MetricRegistry.get(metricId);
        if (plugin) {
          let referenceText = context.referenceText;

          // Use inputData as reference if no explicit reference text
          if (!referenceText && context.inputData) {
            referenceText =
              typeof context.inputData === 'string'
                ? context.inputData
                : JSON.stringify(context.inputData);
          }

          if (referenceText) {
            conditionalMetrics.push({
              id: metricId,
              input: referenceText,
            });
          }
        }
      }
    }

    // Auto-include precision/recall/f-score when reference text exists
    if (context.referenceText || context.inputData) {
      const qualityMetrics = ['precision', 'recall', 'f_score'];

      for (const metricId of qualityMetrics) {
        const plugin = MetricRegistry.get(metricId);
        if (plugin && !context.selectedMetrics.some((m) => m.id === metricId)) {
          let referenceText = context.referenceText;

          if (!referenceText && context.inputData) {
            referenceText =
              typeof context.inputData === 'string'
                ? context.inputData
                : JSON.stringify(context.inputData);
          }

          if (referenceText) {
            conditionalMetrics.push({
              id: metricId,
              input: referenceText,
            });
          }
        }
      }
    }

    return conditionalMetrics;
  }

  /**
   * Get memory-aware metrics based on system resources
   */
  static getMemoryAwareMetrics(totalMemoryGB: number): MetricInput[] {
    const memoryMetrics: MetricInput[] = [];

    // Include sentiment metrics only on systems with sufficient memory
    if (totalMemoryGB >= 2) {
      const sentimentMetrics = ['sentiment', 'sentiment_detailed'];

      for (const metricId of sentimentMetrics) {
        const plugin = MetricRegistry.get(metricId);
        if (plugin) {
          memoryMetrics.push({ id: metricId });
        }
      }
    }

    return memoryMetrics;
  }

  /**
   * Get environment-specific metrics
   */
  static getEnvironmentMetrics(): MetricInput[] {
    const envMetrics: MetricInput[] = [];

    // Include performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      const performanceMetrics = ['response_latency'];

      for (const metricId of performanceMetrics) {
        const plugin = MetricRegistry.get(metricId);
        if (plugin) {
          envMetrics.push({ id: metricId });
        }
      }
    }

    return envMetrics;
  }
}
