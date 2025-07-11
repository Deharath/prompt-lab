import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateQualityMetrics } from '../../../lib/metricCalculators.js';
import { textWorker } from '../../../lib/textWorker.js';

export const fScorePlugin: MetricPlugin = {
  id: 'f_score',
  name: 'F-Score',
  description: 'Balanced precision and recall',
  category: 'quality' as MetricCategory,
  version: '1.0.0',
  requiresInput: true,
  inputLabel: 'Reference Text',
  inputPlaceholder: 'Enter reference text to compare against...',

  displayConfig: {
    id: 'f_score',
    name: 'F-Score',
    description: 'Balanced precision and recall',
    category: 'quality' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.8, warning: 0.6, error: 0.4 },
    tooltip: 'Harmonic mean of precision and recall',
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
    return qualityMetrics.f_score;
  },

  validate(input?: string): boolean {
    return !!input && input.trim().length > 0;
  },
};

export const isDefault = false;
