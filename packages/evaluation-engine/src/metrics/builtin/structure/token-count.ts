import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { textWorker } from '../../../lib/textWorker.js';

export const tokenCountPlugin: MetricPlugin = {
  id: 'token_count',
  name: 'Token Count',
  description: 'Total number of tokens in the text',
  category: 'structure' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'token_count',
    name: 'Token Count',
    description: 'Total number of tokens in the text',
    category: 'structure' as MetricCategory,
    unit: 'tokens',
    tooltip: 'Total number of tokens (subword units) in the text',
  },

  async calculate(text: string): Promise<number> {
    const stats = textWorker.analyzeText(text);
    return stats.tokenCount;
  },
};

export const isDefault = true;
