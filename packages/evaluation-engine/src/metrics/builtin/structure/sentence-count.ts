import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { textWorker } from '../../../lib/textWorker.js';

export const sentenceCountPlugin: MetricPlugin = {
  id: 'sentence_count',
  name: 'Sentence Count',
  description: 'Total number of sentences',
  category: 'structure' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'sentence_count',
    name: 'Sentence Count',
    description: 'Total number of sentences',
    category: 'structure' as MetricCategory,
    unit: 'sentences',
    tooltip: 'Total number of sentences in the text',
  },

  async calculate(text: string): Promise<number> {
    const stats = textWorker.analyzeText(text);
    return stats.sentenceCount;
  },
};

export const isDefault = true;
