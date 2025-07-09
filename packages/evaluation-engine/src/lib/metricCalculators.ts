/**
 * Reusable metric calculation functions to eliminate code duplication
 */

import { type MetricResult } from '@prompt-lab/shared-types';

/**
 * Common text statistics interface
 */
export interface TextStatistics {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  words: string[];
}

/**
 * Constants for metric calculations
 */
export const METRIC_CONSTANTS = {
  WORD_COUNT_THRESHOLD: 100,
  SENTENCE_LENGTH_MIN: 5,
  SENTENCE_LENGTH_MAX: 25,
  PRECISION_RECALL_WEIGHTS: {
    DEPTH: 0.4,
    STRUCTURE: 0.3,
    DIVERSITY: 0.3,
  },
} as const;

/**
 * Calculate precision metric with consistent logic
 */
export function calculatePrecision(
  llmOutput: string,
  referenceText: string,
  textStats: TextStatistics,
): number {
  if (textStats.wordCount === 0) return 0;

  const outputWords = new Set(textStats.words.map((w) => w.toLowerCase()));
  const referenceWords = new Set(
    referenceText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0),
  );

  const intersection = new Set(
    [...outputWords].filter((word) => referenceWords.has(word)),
  );

  return intersection.size / outputWords.size;
}

/**
 * Calculate recall metric with consistent logic
 */
export function calculateRecall(
  llmOutput: string,
  referenceText: string,
  textStats: TextStatistics,
): number {
  if (!referenceText) return 0;

  const outputWords = new Set(textStats.words.map((w) => w.toLowerCase()));
  const referenceWords = new Set(
    referenceText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0),
  );

  if (referenceWords.size === 0) return 0;

  const intersection = new Set(
    [...referenceWords].filter((word) => outputWords.has(word)),
  );

  return intersection.size / referenceWords.size;
}

/**
 * Calculate F-score from precision and recall
 */
export function calculateFScore(precision: number, recall: number): number {
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

/**
 * Calculate vocabulary diversity
 */
export function calculateVocabularyDiversity(
  textStats: TextStatistics,
): number {
  if (textStats.wordCount === 0) return 0;

  const uniqueWords = new Set(textStats.words.map((w) => w.toLowerCase()));
  return uniqueWords.size / textStats.wordCount;
}

/**
 * Calculate completeness score based on depth, structure, and diversity
 */
export function calculateCompletenessScore(textStats: TextStatistics): number {
  if (textStats.wordCount === 0) return 0;

  const depthScore = Math.min(
    textStats.wordCount / METRIC_CONSTANTS.WORD_COUNT_THRESHOLD,
    1.0,
  );

  const structuralScore =
    textStats.avgWordsPerSentence > METRIC_CONSTANTS.SENTENCE_LENGTH_MIN &&
    textStats.avgWordsPerSentence < METRIC_CONSTANTS.SENTENCE_LENGTH_MAX
      ? 1.0
      : 0.7;

  const diversityScore = calculateVocabularyDiversity(textStats);

  return (
    depthScore * METRIC_CONSTANTS.PRECISION_RECALL_WEIGHTS.DEPTH +
    structuralScore * METRIC_CONSTANTS.PRECISION_RECALL_WEIGHTS.STRUCTURE +
    diversityScore * METRIC_CONSTANTS.PRECISION_RECALL_WEIGHTS.DIVERSITY
  );
}

/**
 * Calculate text complexity score
 */
export function calculateTextComplexity(
  textStats: TextStatistics,
  readabilityScore: number,
): number {
  if (textStats.wordCount === 0) return 0;

  const diversityScore = calculateVocabularyDiversity(textStats);
  const lengthComplexity = Math.min(textStats.avgWordsPerSentence / 20, 1.0);

  // Normalize readability score (Flesch Reading Ease: higher = easier)
  const readabilityComplexity = Math.max(0, (100 - readabilityScore) / 100);

  return (
    diversityScore * 0.4 + lengthComplexity * 0.3 + readabilityComplexity * 0.3
  );
}

/**
 * Calculate quality metrics bundle (precision, recall, f-score)
 */
export function calculateQualityMetrics(
  llmOutput: string,
  referenceText: string,
  textStats: TextStatistics,
): Pick<MetricResult, 'precision' | 'recall' | 'f_score'> {
  if (!referenceText) {
    return {
      precision: 0,
      recall: 0,
      f_score: 0,
    };
  }

  const precision = calculatePrecision(llmOutput, referenceText, textStats);
  const recall = calculateRecall(llmOutput, referenceText, textStats);
  const f_score = calculateFScore(precision, recall);

  return { precision, recall, f_score };
}

/**
 * Validate JSON string
 */
export function validateJsonString(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe metric calculation wrapper with error handling
 */
export function safeCalculateMetric<T>(
  calculator: () => T,
  fallbackValue: T,
  metricName: string,
): T {
  try {
    return calculator();
  } catch (error) {
    console.warn(`Failed to calculate ${metricName}:`, error);
    return fallbackValue;
  }
}
