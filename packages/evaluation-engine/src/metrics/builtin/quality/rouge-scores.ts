import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';
import { calculateRougeScores } from '../../../lib/metricCalculators.js';

export const rouge1Plugin: MetricPlugin = {
  id: 'rouge_1',
  name: 'ROUGE-1',
  description: 'Unigram overlap with reference text',
  category: 'quality' as MetricCategory,
  version: '1.0.0',
  requiresInput: true,
  inputLabel: 'Reference Text',
  inputPlaceholder: 'Enter reference text to compare against...',

  displayConfig: {
    id: 'rouge_1',
    name: 'ROUGE-1',
    description: 'Unigram overlap with reference text',
    category: 'quality' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.7, warning: 0.4, error: 0.2 },
    tooltip: 'ROUGE score using unigram overlap for word-level similarity',
  },

  async calculate(
    text: string,
    referenceText?: string,
  ): Promise<number | undefined> {
    if (!referenceText) {
      return undefined;
    }

    const scores = calculateRougeScores(text, referenceText);
    return scores.rouge1;
  },

  validate(input?: string): boolean {
    return !!input && input.trim().length > 0;
  },
};

export const rouge2Plugin: MetricPlugin = {
  id: 'rouge_2',
  name: 'ROUGE-2',
  description: 'Bigram overlap with reference text',
  category: 'quality' as MetricCategory,
  version: '1.0.0',
  requiresInput: true,
  inputLabel: 'Reference Text',
  inputPlaceholder: 'Enter reference text to compare against...',

  displayConfig: {
    id: 'rouge_2',
    name: 'ROUGE-2',
    description: 'Bigram overlap with reference text',
    category: 'quality' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.6, warning: 0.3, error: 0.1 },
    tooltip: 'ROUGE score using bigram overlap for phrase-level similarity',
  },

  async calculate(
    text: string,
    referenceText?: string,
  ): Promise<number | undefined> {
    if (!referenceText) {
      return undefined;
    }

    const scores = calculateRougeScores(text, referenceText);
    return scores.rouge2;
  },

  validate(input?: string): boolean {
    return !!input && input.trim().length > 0;
  },
};

export const rougeLPlugin: MetricPlugin = {
  id: 'rouge_l',
  name: 'ROUGE-L',
  description: 'Longest common subsequence similarity',
  category: 'quality' as MetricCategory,
  version: '1.0.0',
  requiresInput: true,
  inputLabel: 'Reference Text',
  inputPlaceholder: 'Enter reference text to compare against...',

  displayConfig: {
    id: 'rouge_l',
    name: 'ROUGE-L',
    description: 'Longest common subsequence similarity',
    category: 'quality' as MetricCategory,
    precision: 3,
    thresholds: { good: 0.7, warning: 0.4, error: 0.2 },
    tooltip:
      'ROUGE score based on longest common subsequence for structural similarity',
  },

  async calculate(
    text: string,
    referenceText?: string,
  ): Promise<number | undefined> {
    if (!referenceText) {
      return undefined;
    }

    const scores = calculateRougeScores(text, referenceText);
    return scores.rougeL;
  },

  validate(input?: string): boolean {
    return !!input && input.trim().length > 0;
  },
};

export const isDefault = true;
