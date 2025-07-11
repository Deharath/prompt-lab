import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateReadabilityScores } from '../../../lib/readabilityService.js';
import { calculateTextComplexity } from '../../../lib/metricCalculators.js';
import { textWorker } from '../../../lib/textWorker.js';

export const textComplexityPlugin: MetricPlugin = {
  id: 'text_complexity',
  name: 'Text Complexity',
  description: 'Overall text complexity score',
  category: 'readability' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'text_complexity',
    name: 'Text Complexity',
    description: 'Overall text complexity score',
    category: 'readability' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.3, warning: 0.6, error: 0.8 },
    tooltip:
      'Combined complexity metric based on vocabulary, sentence length, and readability',
  },

  async calculate(text: string): Promise<number> {
    const textStats = textWorker.analyzeText(text);
    const readabilityScores = await calculateReadabilityScores(text);
    return calculateTextComplexity(
      textStats,
      readabilityScores.fleschReadingEase,
    );
  },
};

export const isDefault = false;
