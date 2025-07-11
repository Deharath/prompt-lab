import type {
  MetricPlugin,
  MetricCategory,
  SentimentResult,
} from '@prompt-lab/shared-types';
import { analyzeSentiment } from '../../../lib/sentimentService.js';

export const sentimentPlugin: MetricPlugin = {
  id: 'sentiment',
  name: 'Sentiment',
  description: 'Overall emotional tone',
  category: 'sentiment' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'sentiment',
    name: 'Sentiment',
    description: 'Overall emotional tone',
    category: 'sentiment' as MetricCategory,
    tooltip: "AI-powered sentiment analysis of the text's emotional tone",
  },

  async calculate(
    text: string,
    input?: string,
    context?: any,
  ): Promise<SentimentResult> {
    const disabledMetrics = context?.disabledMetrics || new Set();
    const isDisabled = disabledMetrics.has('sentiment');

    const sentimentResult = await analyzeSentiment(text, true, isDisabled);

    // Handle different return types from sentiment analysis
    if (typeof sentimentResult === 'number') {
      return {
        label:
          sentimentResult > 0
            ? 'positive'
            : sentimentResult < 0
              ? 'negative'
              : 'neutral',
        score: sentimentResult,
        confidence: 0.5,
      };
    } else if ('disabled' in sentimentResult && sentimentResult.disabled) {
      return {
        label: sentimentResult.label,
        score: sentimentResult.compound,
        confidence: sentimentResult.confidence,
      };
    } else {
      return {
        label: sentimentResult.label,
        score: sentimentResult.compound,
        confidence: sentimentResult.confidence,
      };
    }
  },
};

export const isDefault = true;
