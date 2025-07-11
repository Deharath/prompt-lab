/**
 * Reusable metric calculation functions to eliminate code duplication
 */

import { type MetricResult } from '@prompt-lab/shared-types';
import { textWorker } from './textWorker.js';

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
 * Generate n-grams from a list of tokens
 */
function generateNGrams(tokens: string[], n: number): string[] {
  if (n <= 0 || tokens.length < n) return [];

  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Count overlapping n-grams between candidate and reference
 */
function countNGramOverlaps(
  candidateNGrams: string[],
  referenceNGrams: string[],
): number {
  const referenceCounts = new Map<string, number>();

  // Count reference n-grams
  for (const ngram of referenceNGrams) {
    referenceCounts.set(ngram, (referenceCounts.get(ngram) || 0) + 1);
  }

  let overlaps = 0;
  const candidateCounts = new Map<string, number>();

  // Count candidate n-grams and overlaps
  for (const ngram of candidateNGrams) {
    const candidateCount = (candidateCounts.get(ngram) || 0) + 1;
    candidateCounts.set(ngram, candidateCount);

    const referenceCount = referenceCounts.get(ngram) || 0;
    if (candidateCount <= referenceCount) {
      overlaps++;
    }
  }

  return overlaps;
}

/**
 * Calculate BLEU score (simplified version with geometric mean of 1-4 grams)
 */
export function calculateBleuScore(
  candidate: string,
  reference: string,
): number {
  if (!candidate || !reference) return 0;

  // Tokenize using existing text worker
  const candidateStats = textWorker.analyzeText(candidate);
  const referenceStats = textWorker.analyzeText(reference);

  const candidateTokens = candidateStats.words;
  const referenceTokens = referenceStats.words;

  if (candidateTokens.length === 0 || referenceTokens.length === 0) return 0;

  // Calculate precision for n-grams 1-4
  const precisions: number[] = [];

  for (let n = 1; n <= 4; n++) {
    const candidateNGrams = generateNGrams(candidateTokens, n);
    const referenceNGrams = generateNGrams(referenceTokens, n);

    if (candidateNGrams.length === 0) {
      precisions.push(0);
      continue;
    }

    const overlaps = countNGramOverlaps(candidateNGrams, referenceNGrams);
    const precision = overlaps / candidateNGrams.length;
    precisions.push(precision);
  }

  // Geometric mean of precisions (exclude zero precisions for stability)
  const nonZeroPrecisions = precisions.filter((p) => p > 0);
  if (nonZeroPrecisions.length === 0) return 0;

  const geometricMean = Math.pow(
    nonZeroPrecisions.reduce((prod, p) => prod * p, 1),
    1 / nonZeroPrecisions.length,
  );

  // Brevity penalty
  const brevityPenalty =
    candidateTokens.length >= referenceTokens.length
      ? 1
      : Math.exp(1 - referenceTokens.length / candidateTokens.length);

  return geometricMean * brevityPenalty;
}

/**
 * ROUGE scores interface
 */
export interface RougeScores {
  rouge1: number; // ROUGE-1 (unigram overlap)
  rouge2: number; // ROUGE-2 (bigram overlap)
  rougeL: number; // ROUGE-L (longest common subsequence)
}

/**
 * Calculate ROUGE-1 and ROUGE-2 scores (F1-based)
 */
export function calculateRougeScores(
  candidate: string,
  reference: string,
): RougeScores {
  if (!candidate || !reference) {
    return { rouge1: 0, rouge2: 0, rougeL: 0 };
  }

  const candidateStats = textWorker.analyzeText(candidate);
  const referenceStats = textWorker.analyzeText(reference);

  const candidateTokens = candidateStats.words;
  const referenceTokens = referenceStats.words;

  if (candidateTokens.length === 0 || referenceTokens.length === 0) {
    return { rouge1: 0, rouge2: 0, rougeL: 0 };
  }

  // ROUGE-1 (unigram overlap)
  const rouge1 = calculateRougeN(candidateTokens, referenceTokens, 1);

  // ROUGE-2 (bigram overlap)
  const rouge2 = calculateRougeN(candidateTokens, referenceTokens, 2);

  // ROUGE-L (longest common subsequence)
  const rougeL = calculateRougeL(candidateTokens, referenceTokens);

  return { rouge1, rouge2, rougeL };
}

/**
 * Calculate ROUGE-N score (F1-based)
 */
function calculateRougeN(
  candidateTokens: string[],
  referenceTokens: string[],
  n: number,
): number {
  const candidateNGrams = generateNGrams(candidateTokens, n);
  const referenceNGrams = generateNGrams(referenceTokens, n);

  if (candidateNGrams.length === 0 || referenceNGrams.length === 0) return 0;

  const overlaps = countNGramOverlaps(candidateNGrams, referenceNGrams);

  const precision = overlaps / candidateNGrams.length;
  const recall = overlaps / referenceNGrams.length;

  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

/**
 * Calculate ROUGE-L score (longest common subsequence based)
 */
function calculateRougeL(
  candidateTokens: string[],
  referenceTokens: string[],
): number {
  const lcsLength = longestCommonSubsequence(candidateTokens, referenceTokens);

  if (lcsLength === 0) return 0;

  const precision = lcsLength / candidateTokens.length;
  const recall = lcsLength / referenceTokens.length;

  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

/**
 * Calculate longest common subsequence length
 */
function longestCommonSubsequence(seq1: string[], seq2: string[]): number {
  const m = seq1.length;
  const n = seq2.length;

  // Create DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
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
