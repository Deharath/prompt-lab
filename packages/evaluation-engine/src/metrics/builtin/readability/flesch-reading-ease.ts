import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateReadabilityScores } from '../../../lib/readabilityService.js';

export const fleschReadingEasePlugin: MetricPlugin = {
  id: 'flesch_reading_ease',
  name: 'Flesch Reading Ease',
  description: 'Text readability score (0-100, higher = easier)',
  category: 'readability' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'flesch_reading_ease',
    name: 'Flesch Reading Ease',
    description: 'Text readability score (0-100, higher = easier)',
    category: 'readability' as MetricCategory,
    precision: 1,
    thresholds: { good: 60, warning: 30, error: 0 },
    tooltip:
      'Measures how easy text is to read. Scores: 90-100 (Very Easy), 80-89 (Easy), 70-79 (Fairly Easy), 60-69 (Standard), 50-59 (Fairly Difficult), 30-49 (Difficult), 0-29 (Very Difficult)',
  },

  async calculate(text: string): Promise<number> {
    const scores = await calculateReadabilityScores(text);
    return scores.fleschReadingEase;
  },
};

export const isDefault = true;
