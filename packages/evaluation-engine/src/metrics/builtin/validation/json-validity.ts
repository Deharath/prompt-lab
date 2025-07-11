import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { validateJsonString } from '../../../lib/metricCalculators.js';

export const jsonValidityPlugin: MetricPlugin = {
  id: 'is_valid_json',
  name: 'Valid JSON',
  description: 'JSON format validation',
  category: 'validation' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'is_valid_json',
    name: 'Valid JSON',
    description: 'JSON format validation',
    category: 'validation' as MetricCategory,
    tooltip: 'Checks if the text is valid JSON format',
  },

  async calculate(text: string): Promise<boolean> {
    return validateJsonString(text);
  },
};

export const isDefault = false;
