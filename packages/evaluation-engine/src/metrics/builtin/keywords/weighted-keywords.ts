import type {
  MetricPlugin,
  MetricCategory,
  KeywordResult,
  KeywordWeight,
} from '@prompt-lab/shared-types';
import { calculateKeywordMetrics } from '../../../lib/keywordMetrics.js';

export const weightedKeywordsPlugin: MetricPlugin = {
  id: 'weighted_keywords',
  name: 'Weighted Keywords',
  description: 'Weighted keyword analysis',
  category: 'keywords' as MetricCategory,
  version: '1.0.0',
  requiresInput: true,
  inputLabel: 'Weighted Keywords (JSON)',
  inputPlaceholder: 'Enter JSON array of {keyword, weight} objects...',

  displayConfig: {
    id: 'weighted_keywords',
    name: 'Weighted Keywords',
    description: 'Weighted keyword analysis',
    category: 'keywords' as MetricCategory,
    tooltip: 'Keyword analysis with importance weights',
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

    try {
      const weightedKeywords: KeywordWeight[] = JSON.parse(input);
      const keywordResult = calculateKeywordMetrics(text, weightedKeywords);

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
    } catch (error) {
      // Invalid JSON format - return empty result
      return {
        found: [],
        missing: [],
        foundCount: 0,
        missingCount: 0,
        matchPercentage: 0,
        totalMatches: 0,
      };
    }
  },

  validate(input?: string): boolean {
    if (!input || input.trim().length === 0) {
      return false;
    }

    try {
      const parsed = JSON.parse(input);
      return (
        Array.isArray(parsed) &&
        parsed.every(
          (item) =>
            typeof item === 'object' &&
            'keyword' in item &&
            'weight' in item &&
            typeof item.keyword === 'string' &&
            typeof item.weight === 'number',
        )
      );
    } catch {
      return false;
    }
  },
};

export const isDefault = false;
