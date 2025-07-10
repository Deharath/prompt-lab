/**
 * Task 11 - Backend Metric Calculation
 * New metric calculation functions to replace DIY metrics
 * Implements Tasks 2-5 functionality
 */

import { textWorker } from './textWorker.js';
import { calculateReadabilityScores } from './readabilityService.js';
import { analyzeSentiment, type SentimentScore } from './sentimentService.js';
import { recordLatency } from './latencyLogger.js';
import {
  calculateKeywordMetrics,
  type KeywordWeight,
} from './keywordMetrics.js';
import {
  type MetricInput,
  type MetricResult,
  type MetricsCalculationResult,
  type MetricError,
  type MetricContext,
  type SentimentResult,
  type DetailedSentimentResult,
  type KeywordResult,
} from '@prompt-lab/shared-types';
import { getCachedMetrics, cacheMetrics } from './metricsCache.js';
import {
  calculateQualityMetrics,
  calculateVocabularyDiversity,
  calculateCompletenessScore,
  calculateTextComplexity,
  validateJsonString,
  safeCalculateMetric,
  type TextStatistics,
} from './metricCalculators.js';
import {
  MetricsErrorHandler,
  safeMetricCalculation,
  safeAsyncMetricCalculation,
  validateTextInput,
  validateMetricInput,
} from './errorHandling.js';

/**
 * Main metrics calculation function that replaces the DIY implementation
 */
export async function calculateMetrics(
  text: string,
  selectedMetrics: MetricInput[],
  disabledMetrics: Set<string> = new Set(),
  referenceText?: string,
): Promise<MetricsCalculationResult> {
  const startTime = performance.now();
  const errorHandler = new MetricsErrorHandler();

  // Validate inputs
  try {
    validateTextInput(text, 'calculateMetrics');
  } catch (error) {
    return {
      results: {},
      errors: [
        {
          metricId: 'validation',
          error: error instanceof Error ? error.message : String(error),
        },
      ],
      processingTime: performance.now() - startTime,
    };
  }

  if (!selectedMetrics || selectedMetrics.length === 0) {
    return {
      results: {},
      errors: [],
      processingTime: performance.now() - startTime,
    };
  }

  // Check cache first
  const cachedResult = getCachedMetrics(
    text,
    selectedMetrics,
    disabledMetrics,
    referenceText,
  );
  if (cachedResult) {
    const cacheProcessingTime = performance.now() - startTime;
    
    // Record cache hit latency
    recordLatency('metrics_calculation', cacheProcessingTime, {
      metricCount: selectedMetrics.length,
      textLength: text.length,
      cacheHit: true,
    });
    
    return {
      ...cachedResult,
      processingTime: cacheProcessingTime,
    };
  }

  const results: MetricResult = {};

  // Pre-calculate common expensive operations to reuse with error handling
  const textStats = safeMetricCalculation(
    'textStats',
    () => textWorker.analyzeText(text),
    {
      tokens: [],
      words: [],
      sentences: [],
      wordCount: 0,
      sentenceCount: 0,
      avgWordsPerSentence: 0,
    },
    { text: text.substring(0, 100) },
  );

  const readabilityScores = await safeAsyncMetricCalculation(
    'readabilityScores',
    () => calculateReadabilityScores(text),
    { fleschReadingEase: 0, fleschKincaid: 0, smog: 0, textLength: 0 },
    { textLength: text.length },
  );

  for (const metric of selectedMetrics) {
    // Skip disabled metrics
    if (disabledMetrics.has(metric.id)) {
      continue;
    }

    try {
      // Validate metric input if required
      if (metric.input !== undefined) {
        validateMetricInput(metric.id, metric.input);
      }

      switch (metric.id) {
        case 'flesch_reading_ease': {
          results.flesch_reading_ease = readabilityScores.fleschReadingEase;
          break;
        }

        case 'flesch_kincaid': {
          results.flesch_kincaid_grade = readabilityScores.fleschKincaid;
          break;
        }

        case 'smog': {
          results.smog_index = readabilityScores.smog;
          break;
        }

        case 'sentiment': {
          const isDisabled = disabledMetrics.has('sentiment');
          const sentimentResult = await analyzeSentiment(
            text,
            true,
            isDisabled, // Force disable if in disabled metrics set
          );

          // If sentiment analysis is disabled or returns a number
          if (typeof sentimentResult === 'number') {
            results.sentiment = {
              label:
                sentimentResult > 0
                  ? 'positive'
                  : sentimentResult < 0
                    ? 'negative'
                    : 'neutral',
              score: sentimentResult,
              confidence: 0.5,
            };
          } else if (
            'disabled' in sentimentResult &&
            sentimentResult.disabled
          ) {
            results.sentiment = {
              label: sentimentResult.label,
              score: sentimentResult.compound,
              confidence: sentimentResult.confidence,
            };
          } else {
            results.sentiment = {
              label: sentimentResult.label,
              score: sentimentResult.compound,
              confidence: sentimentResult.confidence,
            };
          }
          break;
        }

        case 'sentiment_detailed': {
          const isDisabled =
            disabledMetrics.has('sentiment_detailed') ||
            disabledMetrics.has('sentiment');
          const detailedResult = await analyzeSentiment(text, true, isDisabled);

          if (typeof detailedResult === 'number') {
            results.sentiment_detailed = {
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
            results.sentiment_detailed = {
              positive: detailedResult.positive,
              negative: detailedResult.negative,
              neutral: detailedResult.neutral,
              compound: detailedResult.compound,
              label: detailedResult.label,
            };
          }
          break;
        }

        case 'is_valid_json': {
          results.is_valid_json = validateJsonString(text);
          break;
        }

        case 'word_count': {
          results.word_count = textStats.wordCount;
          break;
        }

        case 'token_count': {
          results.token_count = textStats.tokenCount;
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
          } else {
            results.keywords = {
              found: [],
              missing: [],
              foundCount: 0,
              missingCount: 0,
              matchPercentage: 0,
              totalMatches: 0,
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
              results.weighted_keywords = {
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
            } catch (error) {
              // Invalid JSON format for weighted keywords - return error result
              results.weighted_keywords = {
                found: [],
                missing: [],
                foundCount: 0,
                missingCount: 0,
                matchPercentage: 0,
                totalMatches: 0,
              };
            }
          } else {
            results.weighted_keywords = {
              found: [],
              missing: [],
              foundCount: 0,
              missingCount: 0,
              matchPercentage: 0,
              totalMatches: 0,
            };
          }
          break;
        }

        case 'precision':
        case 'recall':
        case 'f_score': {
          // Calculate quality metrics bundle to avoid duplication
          const refText = metric.input || referenceText || '';
          const qualityMetrics = safeCalculateMetric(
            () => calculateQualityMetrics(text, refText, textStats),
            { precision: 0, recall: 0, f_score: 0 },
            'quality metrics',
          );

          // Only set the requested metric
          if (metric.id === 'precision') {
            results.precision = qualityMetrics.precision;
          } else if (metric.id === 'recall') {
            results.recall = qualityMetrics.recall;
          } else if (metric.id === 'f_score') {
            results.f_score = qualityMetrics.f_score;
          }
          break;
        }

        case 'vocab_diversity': {
          results.vocab_diversity = safeCalculateMetric(
            () => calculateVocabularyDiversity(textStats),
            0,
            'vocabulary diversity',
          );
          break;
        }

        case 'completeness_score': {
          results.completeness_score = safeCalculateMetric(
            () => calculateCompletenessScore(textStats),
            0,
            'completeness score',
          );
          break;
        }

        case 'text_complexity': {
          results.text_complexity = safeCalculateMetric(
            () =>
              calculateTextComplexity(
                textStats,
                readabilityScores.fleschReadingEase,
              ),
            0,
            'text complexity',
          );
          break;
        }

        default:
          // Unknown metric ID - skip silently
          break;
      }
    } catch (error) {
      // Use centralized error handling
      errorHandler.handleError(
        metric.id,
        error instanceof Error ? error : new Error(String(error)),
        null,
        { text: text.substring(0, 100), metricInput: metric.input },
      );
    }
  }

  const processingTime = performance.now() - startTime;
  
  // Record latency measurement
  recordLatency('metrics_calculation', processingTime, {
    metricCount: selectedMetrics.length,
    textLength: text.length,
    cacheHit: false,
  });

  const result: MetricsCalculationResult = {
    results,
    errors: errorHandler.getErrors(),
    processingTime,
  };

  // Cache the result for future use
  cacheMetrics(text, selectedMetrics, disabledMetrics, result, referenceText);

  return result;
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
// Legacy function removed - use calculateMetrics directly

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
// Removed duplicate functions - now using shared metric calculators from metricCalculators.ts

// Re-export types for better TypeScript resolution
export type {
  MetricInput,
  MetricResult,
  MetricsCalculationResult,
  MetricError,
  MetricContext,
  SentimentResult,
  DetailedSentimentResult,
  KeywordResult,
} from '@prompt-lab/shared-types';
