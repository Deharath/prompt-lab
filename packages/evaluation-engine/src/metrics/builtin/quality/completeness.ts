import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateCompletenessScore } from '../../../lib/metricCalculators.js';
import { textWorker } from '../../../lib/textWorker.js';

export const completenessPlugin: MetricPlugin = {
  id: 'completeness_score',
  name: 'Completeness',
  description: 'Overall completeness score',
  category: 'quality' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'completeness_score',
    name: 'Completeness',
    description: 'Overall completeness score',
    category: 'quality' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.8, warning: 0.6, error: 0.4 },
    tooltip: 'Measures response depth and completeness',
  },

  async calculate(text: string): Promise<number> {
    const textStats = textWorker.analyzeText(text);
    return calculateCompletenessScore(textStats);
  },
};

export const isDefault = false;
