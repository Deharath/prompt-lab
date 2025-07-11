import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateReadabilityScores } from '../../../lib/readabilityService.js';

export const fleschKincaidGradePlugin: MetricPlugin = {
  id: 'flesch_kincaid_grade',
  name: 'Grade Level',
  description: 'U.S. grade level required to understand the text',
  category: 'readability' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'flesch_kincaid_grade',
    name: 'Grade Level',
    description: 'U.S. grade level required to understand the text',
    category: 'readability' as MetricCategory,
    precision: 1,
    tooltip:
      'Indicates the U.S. school grade level needed to understand the text',
  },

  async calculate(text: string): Promise<number> {
    const scores = await calculateReadabilityScores(text);
    return scores.fleschKincaid;
  },
};

export const isDefault = true;
