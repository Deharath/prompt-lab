import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateQualityMetrics } from '../../../lib/metricCalculators.js';
import { textWorker } from '../../../lib/textWorker.js';

export const recallPlugin: MetricPlugin = {
  id: 'recall',
  name: 'Recall',
  description: 'Content coverage score',
  category: 'quality' as MetricCategory,
  version: '1.0.0',
  requiresInput: true,
  inputLabel: 'Reference Text',
  inputPlaceholder: 'Enter reference text to compare against...',

  displayConfig: {
    id: 'recall',
    name: 'Recall',
    description: 'Content coverage score',
    category: 'quality' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.8, warning: 0.6, error: 0.4 },
    tooltip: 'Measures how much of the reference content is covered',
  },

  async calculate(
    text: string,
    referenceText?: string,
  ): Promise<number | undefined> {
    if (!referenceText) {
      return undefined;
    }

    const textStats = textWorker.analyzeText(text);
    const qualityMetrics = calculateQualityMetrics(
      text,
      referenceText,
      textStats,
    );
    return qualityMetrics.recall;
  },

  validate(input?: string): boolean {
    return !!input && input.trim().length > 0;
  },
};

export const isDefault = false;
