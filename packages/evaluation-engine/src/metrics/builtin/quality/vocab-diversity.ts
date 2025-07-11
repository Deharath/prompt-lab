import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateVocabularyDiversity } from '../../../lib/metricCalculators.js';
import { textWorker } from '../../../lib/textWorker.js';

export const vocabDiversityPlugin: MetricPlugin = {
  id: 'vocab_diversity',
  name: 'Vocabulary Diversity',
  description: 'Ratio of unique words to total words',
  category: 'quality' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'vocab_diversity',
    name: 'Vocabulary Diversity',
    description: 'Ratio of unique words to total words',
    category: 'quality' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.7, warning: 0.5, error: 0.3 },
    tooltip: 'Measures vocabulary richness (unique words / total words)',
  },

  async calculate(text: string): Promise<number> {
    const textStats = textWorker.analyzeText(text);
    return calculateVocabularyDiversity(textStats);
  },
};

export const isDefault = true;
