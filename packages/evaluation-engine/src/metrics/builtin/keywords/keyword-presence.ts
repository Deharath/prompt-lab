import type {
  MetricPlugin,
  MetricCategory,
  KeywordResult,
} from '@prompt-lab/shared-types';
import { calculateKeywordMetrics } from '../../../lib/keywordMetrics.js';
import { parseKeywords } from '../../../lib/metrics.js';

export const keywordPresencePlugin: MetricPlugin = {
  id: 'keywords',
  name: 'Keywords',
  description: 'Keyword presence analysis',
  category: 'keywords' as MetricCategory,
  version: '1.0.0',
  requiresInput: true,
  inputLabel: 'Keywords',
  inputPlaceholder: 'Enter keywords separated by commas...',

  displayConfig: {
    id: 'keywords',
    name: 'Keywords',
    description: 'Keyword presence analysis',
    category: 'keywords' as MetricCategory,
    tooltip: 'Analysis of specified keywords found in the text',
  },

  async calculate(text: string, input?: string): Promise<KeywordResult> {
    if (!input) {
      return {
        found: [],
        missing: [],
        foundCount: 0,
        missingCount: 0,
        matchPercentage: 0,
        totalMatches: 0,
      };
    }

    const keywords = parseKeywords(input);
    const keywordResult = calculateKeywordMetrics(text, keywords);

    return {
      found: keywordResult.matches
        .filter((m) => m.count > 0)
        .map((m) => m.keyword),
      missing: keywordResult.matches
        .filter((m) => m.count === 0)
        .map((m) => m.keyword),
      foundCount: keywordResult.matches.filter((m) => m.count > 0).length,
      missingCount: keywordResult.matches.filter((m) => m.count === 0).length,
      matchPercentage: keywordResult.precision * 100,
      totalMatches: keywordResult.totalMatches,
    };
  },

  validate(input?: string): boolean {
    return !!input && input.trim().length > 0;
  },
};

export const isDefault = false;
