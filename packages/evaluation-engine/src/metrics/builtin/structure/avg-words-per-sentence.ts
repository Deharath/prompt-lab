import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { textWorker } from '../../../lib/textWorker.js';

export const avgWordsPerSentencePlugin: MetricPlugin = {
  id: 'avg_words_per_sentence',
  name: 'Avg Words/Sentence',
  description: 'Average words per sentence',
  category: 'structure' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'avg_words_per_sentence',
    name: 'Avg Words/Sentence',
    description: 'Average words per sentence',
    category: 'structure' as MetricCategory,
    precision: 1,
    tooltip: 'Average number of words per sentence',
  },

  async calculate(text: string): Promise<number> {
    const stats = textWorker.analyzeText(text);
    return stats.avgWordsPerSentence;
  },
};

export const isDefault = true;
