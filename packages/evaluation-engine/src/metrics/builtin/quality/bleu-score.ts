import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateBleuScore } from '../../../lib/metricCalculators.js';

export const bleuScorePlugin: MetricPlugin = {
  id: 'bleu_score',
  name: 'BLEU Score',
  description: 'N-gram overlap similarity with reference text',
  category: 'quality' as MetricCategory,
  version: '1.0.0',
  requiresInput: true,
  inputLabel: 'Reference Text',
  inputPlaceholder: 'Enter reference text to compare against...',

  displayConfig: {
    id: 'bleu_score',
    name: 'BLEU Score',
    description: 'N-gram overlap similarity with reference text',
    category: 'quality' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.7, warning: 0.4, error: 0.2 },
    tooltip:
      'Bilingual Evaluation Understudy score measuring text similarity using n-gram overlap',
  },

  async calculate(
    text: string,
    referenceText?: string,
  ): Promise<number | undefined> {
    if (!referenceText) {
      return undefined;
    }

    return calculateBleuScore(text, referenceText);
  },

  validate(input?: string): boolean {
    return !!input && input.trim().length > 0;
  },
};

export const isDefault = true;
