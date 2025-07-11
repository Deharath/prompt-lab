import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateReadabilityScores } from '../../../lib/readabilityService.js';

export const smogIndexPlugin: MetricPlugin = {
  id: 'smog_index',
  name: 'SMOG Index',
  description: 'Years of education needed to understand the text',
  category: 'readability' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'smog_index',
    name: 'SMOG Index',
    description: 'Years of education needed to understand the text',
    category: 'readability' as MetricCategory,
    precision: 1,
    tooltip:
      'Simple Measure of Gobbledygook - estimates years of education needed to understand the text',
  },

  async calculate(text: string): Promise<number> {
    const scores = await calculateReadabilityScores(text);
    return scores.smog;
  },
};

export const isDefault = true;
