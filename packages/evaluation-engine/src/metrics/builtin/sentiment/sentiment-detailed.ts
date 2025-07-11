import type {
  MetricPlugin,
  MetricCategory,
  DetailedSentimentResult,
} from '@prompt-lab/shared-types';
import { analyzeSentiment } from '../../../lib/sentimentService.js';

export const sentimentDetailedPlugin: MetricPlugin = {
  id: 'sentiment_detailed',
  name: 'Detailed Sentiment',
  description: 'Breakdown of positive, negative, and neutral sentiment',
  category: 'sentiment' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'sentiment_detailed',
    name: 'Detailed Sentiment',
    description: 'Breakdown of positive, negative, and neutral sentiment',
    category: 'sentiment' as MetricCategory,
    tooltip:
      'Detailed sentiment analysis with confidence scores for each emotion',
    colSpan: 2,
  },

  async calculate(
    text: string,
    input?: string,
    context?: any,
  ): Promise<DetailedSentimentResult> {
    const disabledMetrics = context?.disabledMetrics || new Set();
    const isDisabled =
      disabledMetrics.has('sentiment_detailed') ||
      disabledMetrics.has('sentiment');

    const detailedResult = await analyzeSentiment(text, true, isDisabled);

    if (typeof detailedResult === 'number') {
      return {
        positive: detailedResult > 0 ? detailedResult : 0,
        negative: detailedResult < 0 ? Math.abs(detailedResult) : 0,
        neutral: detailedResult === 0 ? 1 : 0,
        compound: detailedResult,
        label:
          detailedResult > 0
            ? 'positive'
            : detailedResult < 0
              ? 'negative'
              : 'neutral',
      };
    } else {
      return {
        positive: detailedResult.positive,
        negative: detailedResult.negative,
        neutral: detailedResult.neutral,
        compound: detailedResult.compound,
        label: detailedResult.label,
      };
    }
  },
};

export const isDefault = false;
