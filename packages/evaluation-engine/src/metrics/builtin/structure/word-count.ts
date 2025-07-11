import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { textWorker } from '../../../lib/textWorker.js';

export const wordCountPlugin: MetricPlugin = {
  id: 'word_count',
  name: 'Word Count',
  description: 'Total number of words',
  category: 'structure' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'word_count',
    name: 'Word Count',
    description: 'Total number of words',
    category: 'structure' as MetricCategory,
    unit: 'words',
    tooltip: 'Total number of words in the text',
  },

  async calculate(text: string): Promise<number> {
    const stats = textWorker.analyzeText(text);
    return stats.wordCount;
  },
};

export const isDefault = true;
