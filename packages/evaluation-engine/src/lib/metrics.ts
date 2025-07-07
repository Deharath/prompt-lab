/**
 * Task 11 - Backend Metric Calculation
 * New metric calculation functions to replace DIY metrics
 * Implements Tasks 2-5 functionality
 */

import { textWorker } from './textWorker.js';
import { calculateReadabilityScores } from './readabilityService.js';
import { analyzeSentiment, type SentimentScore } from './sentimentService.js';
import {
  calculateKeywordMetrics,
  type KeywordWeight,
} from './keywordMetrics.js';

export interface MetricInput {
  id: string;
  input?: string; // For keywords and other parameterized metrics
  weight?: number; // For weighted calculations
}

export interface MetricResult {
  [key: string]: unknown;
}

/**
 * Main metrics calculation function that replaces the DIY implementation
 */
export async function calculateMetrics(
  text: string,
  selectedMetrics: MetricInput[],
): Promise<MetricResult> {
  if (!text || !selectedMetrics || selectedMetrics.length === 0) {
    return {};
  }

  const results: MetricResult = {};

  // Pre-calculate common expensive operations to reuse
  const textStats = textWorker.analyzeText(text);
  const readabilityScores = await calculateReadabilityScores(text);

  for (const metric of selectedMetrics) {
    try {
      switch (metric.id) {
        case 'flesch_reading_ease': {
          results.flesch_reading_ease = readabilityScores.fleschReadingEase;
          break;
        }

        case 'flesch_kincaid': {
          results.flesch_kincaid = readabilityScores.fleschKincaid;
          break;
        }

        case 'smog': {
          results.smog = readabilityScores.smog;
          break;
        }

        case 'sentiment': {
          const sentimentResult = (await analyzeSentiment(
            text,
            true,
          )) as SentimentScore;

          // If sentiment analysis is disabled, store the entire object to show disabled message
          if (sentimentResult.disabled) {
            results.sentiment = sentimentResult;
          } else {
            results.sentiment = sentimentResult.compound; // Store just the compound score (-1 to 1)
          }
          break;
        }

        case 'sentiment_detailed': {
          results.sentiment_detailed = await analyzeSentiment(text, true);
          break;
        }

        case 'is_valid_json': {
          try {
            JSON.parse(text);
            results.is_valid_json = { isValid: true };
          } catch (error) {
            results.is_valid_json = {
              isValid: false,
              errorMessage:
                error instanceof Error ? error.message : 'Invalid JSON',
            };
          }
          break;
        }

        case 'word_count': {
          results.word_count = textStats.wordCount;
          break;
        }

        case 'sentence_count': {
          results.sentence_count = textStats.sentenceCount;
          break;
        }

        case 'avg_words_per_sentence': {
          results.avg_words_per_sentence = textStats.avgWordsPerSentence;
          break;
        }

        case 'keywords': {
          if (metric.input) {
            const keywords = parseKeywords(metric.input);
            const keywordResult = calculateKeywordMetrics(text, keywords);
            results.keywords = {
              found: keywordResult.matches
                .filter((m) => m.count > 0)
                .map((m) => m.keyword),
              missing: keywordResult.matches
                .filter((m) => m.count === 0)
                .map((m) => m.keyword),
              foundCount: keywordResult.matches.filter((m) => m.count > 0)
                .length,
              missingCount: keywordResult.matches.filter((m) => m.count === 0)
                .length,
              matchPercentage: keywordResult.precision * 100,
              totalMatches: keywordResult.totalMatches,
            };
          }
          break;
        }

        case 'weighted_keywords': {
          if (metric.input) {
            try {
              const weightedKeywords: KeywordWeight[] = JSON.parse(
                metric.input,
              );
              const keywordResult = calculateKeywordMetrics(
                text,
                weightedKeywords,
              );
              results.weighted_keywords = keywordResult;
            } catch (error) {
              console.error('Invalid weighted keywords JSON:', error);
              results.weighted_keywords = {
                error: 'Invalid JSON format for weighted keywords',
              };
            }
          }
          break;
        }

        case 'precision': {
          // Content-based precision: Compare LLM output against reference text
          if (metric.input) {
            results.precision = calculateContentBasedPrecision(
              text,
              metric.input,
            );
          } else {
            console.warn(
              'Precision metric requires input data (reference text)',
            );
            results.precision = 0;
          }
          break;
        }

        case 'recall': {
          // Content-based recall: Compare LLM output against reference text
          if (metric.input) {
            results.recall = calculateContentBasedRecall(text, metric.input);
          } else {
            console.warn('Recall metric requires input data (reference text)');
            results.recall = 0;
          }
          break;
        }

        case 'f_score': {
          // Content-based F-score: Harmonic mean of precision and recall
          if (metric.input) {
            const precision = calculateContentBasedPrecision(
              text,
              metric.input,
            );
            const recall = calculateContentBasedRecall(text, metric.input);

            if (precision + recall === 0) {
              results.f_score = 0;
            } else {
              results.f_score = (2 * precision * recall) / (precision + recall);
            }
          } else {
            console.warn('F-score metric requires input data (reference text)');
            results.f_score = 0;
          }
          break;
        }

        case 'vocab_diversity': {
          // Vocabulary diversity: unique words vs total words
          if (textStats.wordCount === 0) {
            results.vocab_diversity = 0;
          } else {
            const uniqueWords = new Set(
              textStats.words.map((w) => w.toLowerCase()),
            );
            results.vocab_diversity = uniqueWords.size / textStats.wordCount;
          }
          break;
        }

        case 'completeness_score': {
          // Content completeness score based on depth and structure
          if (textStats.wordCount === 0) {
            results.completeness_score = 0;
          } else {
            const depthScore = Math.min(textStats.wordCount / 100, 1.0);
            const structuralScore =
              textStats.avgWordsPerSentence > 5 &&
              textStats.avgWordsPerSentence < 25
                ? 1.0
                : 0.7;
            const uniqueWords = new Set(
              textStats.words.map((w) => w.toLowerCase()),
            );
            const diversityScore = uniqueWords.size / textStats.wordCount;

            results.completeness_score =
              depthScore * 0.4 + structuralScore * 0.3 + diversityScore * 0.3;
          }
          break;
        }

        case 'text_complexity': {
          // Complex score based on vocabulary diversity, sentence length, and readability
          const vocabularyDiversity =
            textStats.wordCount > 0
              ? new Set(textStats.words).size / textStats.wordCount
              : 0;
          const avgSentenceLength = textStats.avgWordsPerSentence;
          const readabilityNormalized =
            (100 - readabilityScores.fleschReadingEase) / 100; // Invert so higher = more complex

          results.text_complexity =
            vocabularyDiversity * 0.4 +
            Math.min(avgSentenceLength / 20, 1) * 0.3 +
            readabilityNormalized * 0.3;
          break;
        }

        default:
          console.warn(`Unknown metric ID: ${metric.id}`);
          break;
      }
    } catch (error) {
      console.error(`Error calculating metric ${metric.id}:`, error);
      results[`${metric.id}_error`] =
        error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return results;
}

/**
 * Helper function to parse keywords from metric input
 */
function parseKeywords(input: string): string[] {
  try {
    // Try to parse as JSON array first
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.filter((k) => typeof k === 'string');
    } else if (typeof parsed === 'string') {
      return [parsed];
    }
  } catch {
    // If not JSON, treat as comma-separated
  }

  // Parse as comma-separated keywords
  return input
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/**
 * Legacy compatibility function that returns metrics in the old format
 */
export async function calculateSelectedMetricsLegacy(
  output: string,
  selectedMetrics?: unknown,
): Promise<Record<string, unknown>> {
  if (!selectedMetrics || !Array.isArray(selectedMetrics)) {
    return {};
  }

  const metrics = selectedMetrics as Array<{ id: string; input?: string }>;
  const inputs: MetricInput[] = metrics.map((m) => ({
    id: m.id,
    input: m.input,
  }));

  return await calculateMetrics(output, inputs);
}

/**
 * Get available metric definitions
 */
export function getAvailableMetrics(): Array<{
  id: string;
  name: string;
  description: string;
  requiresInput?: boolean;
}> {
  return [
    {
      id: 'flesch_reading_ease',
      name: 'Flesch Reading Ease',
      description:
        'Measures text readability. Higher scores indicate easier reading.',
    },
    {
      id: 'flesch_kincaid',
      name: 'Flesch-Kincaid Grade Level',
      description:
        'Indicates the U.S. grade level needed to understand the text.',
    },
    {
      id: 'smog',
      name: 'SMOG Grade',
      description:
        'Simple Measure of Gobbledygook - estimates years of education needed.',
    },
    {
      id: 'sentiment',
      name: 'Sentiment Analysis',
      description:
        'Analyzes emotional tone using transformer-based models from -1 (negative) to 1 (positive).',
    },
    {
      id: 'is_valid_json',
      name: 'JSON Validity',
      description: 'Checks if the text is valid JSON format.',
    },
    {
      id: 'word_count',
      name: 'Word Count',
      description: 'Counts the number of words in the text.',
    },
    {
      id: 'sentence_count',
      name: 'Sentence Count',
      description: 'Counts the number of sentences in the text.',
    },
    {
      id: 'keywords',
      name: 'Keyword Presence',
      description: 'Checks for specific keywords in the text.',
      requiresInput: true,
    },
    {
      id: 'precision',
      name: 'Content Precision',
      description: 'Measures focus and relevance (unique words vs repetition).',
      requiresInput: true,
    },
    {
      id: 'recall',
      name: 'Content Recall',
      description: 'Measures completeness and depth of response.',
    },
    {
      id: 'f_score',
      name: 'F-Score',
      description: 'Balanced measure of precision and recall.',
    },
    {
      id: 'text_complexity',
      name: 'Text Complexity',
      description:
        'Overall complexity based on vocabulary, structure, and readability.',
    },
  ];
}

/**
 * Content-based precision: measures how much of the prediction is relevant/accurate
 * compared to the reference text (using word overlap)
 */
function calculateContentBasedPrecision(
  prediction: string,
  reference: string,
): number {
  if (!prediction || !reference) {
    return 0;
  }

  // Normalize and tokenize both texts
  const predWords = new Set(
    prediction
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2), // Filter short words
  );

  const refWords = new Set(
    reference
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );

  if (predWords.size === 0) {
    return 0;
  }

  // Calculate how many prediction words are in reference
  let relevantWords = 0;
  for (const word of predWords) {
    if (refWords.has(word)) {
      relevantWords++;
    }
  }

  return relevantWords / predWords.size;
}

/**
 * Content-based recall: measures how much of the reference content
 * is captured in the prediction (using word overlap)
 */
function calculateContentBasedRecall(
  prediction: string,
  reference: string,
): number {
  if (!prediction || !reference) {
    return 0;
  }

  // Normalize and tokenize both texts
  const predWords = new Set(
    prediction
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );

  const refWords = new Set(
    reference
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );

  if (refWords.size === 0) {
    return 0;
  }

  // Calculate how many reference words are captured in prediction
  let capturedWords = 0;
  for (const word of refWords) {
    if (predWords.has(word)) {
      capturedWords++;
    }
  }

  return capturedWords / refWords.size;
}
