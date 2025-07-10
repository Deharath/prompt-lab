/**
 * Unified metrics processing engine
 * Replaces duplicated logic in metricsProcessor.ts and UnifiedPanelResults.tsx
 */

import {
  type MetricResult,
  type MetricDisplayItem,
  type MetricGroup,
  type ProcessedMetricsResult,
  type MetricProcessingOptions,
  type MetricDisplayConfig,
  type MetricFormatter,
  MetricCategory,
  getMetricCategoryTitle,
  getMetricCategoryDescription,
  createEmptyMetricsResult,
} from '@prompt-lab/shared-types';

// Centralized metric display configuration
export const METRIC_DISPLAY_CONFIG: Record<string, MetricDisplayConfig> = {
  flesch_reading_ease: {
    id: 'flesch_reading_ease',
    name: 'Flesch Reading Ease',
    description: 'Text readability score (0-100, higher = easier)',
    category: MetricCategory.READABILITY,
    precision: 1,
    thresholds: { good: 60, warning: 30, error: 0 },
    tooltip:
      'Measures how easy text is to read. Scores: 90-100 (Very Easy), 80-89 (Easy), 70-79 (Fairly Easy), 60-69 (Standard), 50-59 (Fairly Difficult), 30-49 (Difficult), 0-29 (Very Difficult)',
  },
  flesch_kincaid_grade: {
    id: 'flesch_kincaid_grade',
    name: 'Grade Level',
    description: 'U.S. grade level required to understand the text',
    category: MetricCategory.READABILITY,
    precision: 1,
    tooltip:
      'Indicates the U.S. school grade level needed to understand the text',
  },
  smog_index: {
    id: 'smog_index',
    name: 'SMOG Index',
    description: 'Years of education needed to understand the text',
    category: MetricCategory.READABILITY,
    precision: 1,
    tooltip:
      'Simple Measure of Gobbledygook - estimates years of education needed to understand the text',
  },
  sentiment: {
    id: 'sentiment',
    name: 'Sentiment',
    description: 'Overall emotional tone',
    category: MetricCategory.SENTIMENT,
    tooltip: "AI-powered sentiment analysis of the text's emotional tone",
  },
  sentiment_detailed: {
    id: 'sentiment_detailed',
    name: 'Detailed Sentiment',
    description: 'Breakdown of positive, negative, and neutral sentiment',
    category: MetricCategory.SENTIMENT,
    tooltip:
      'Detailed sentiment analysis with confidence scores for each emotion',
    colSpan: 2,
  },
  word_count: {
    id: 'word_count',
    name: 'Word Count',
    description: 'Total number of words',
    category: MetricCategory.STRUCTURE,
    unit: 'words',
    tooltip: 'Total number of words in the text',
  },
  sentence_count: {
    id: 'sentence_count',
    name: 'Sentence Count',
    description: 'Total number of sentences',
    category: MetricCategory.STRUCTURE,
    unit: 'sentences',
    tooltip: 'Total number of sentences in the text',
  },
  avg_words_per_sentence: {
    id: 'avg_words_per_sentence',
    name: 'Avg Words/Sentence',
    description: 'Average words per sentence',
    category: MetricCategory.STRUCTURE,
    precision: 1,
    tooltip: 'Average number of words per sentence',
  },
  vocab_diversity: {
    id: 'vocab_diversity',
    name: 'Vocabulary Diversity',
    description: 'Ratio of unique words to total words',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.7, warning: 0.5, error: 0.3 },
    tooltip: 'Measures vocabulary richness (unique words / total words)',
  },
  keywords: {
    id: 'keywords',
    name: 'Keywords',
    description: 'Keyword presence analysis',
    category: MetricCategory.KEYWORDS,
    tooltip: 'Analysis of specified keywords found in the text',
  },
  weighted_keywords: {
    id: 'weighted_keywords',
    name: 'Weighted Keywords',
    description: 'Weighted keyword analysis',
    category: MetricCategory.KEYWORDS,
    tooltip: 'Keyword analysis with importance weights',
  },
  precision: {
    id: 'precision',
    name: 'Precision',
    description: 'Content relevance score',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.8, warning: 0.6, error: 0.4 },
    tooltip: 'Measures how much of the output is relevant to the reference',
  },
  recall: {
    id: 'recall',
    name: 'Recall',
    description: 'Content coverage score',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.8, warning: 0.6, error: 0.4 },
    tooltip: 'Measures how much of the reference content is covered',
  },
  f_score: {
    id: 'f_score',
    name: 'F-Score',
    description: 'Balanced precision and recall',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.8, warning: 0.6, error: 0.4 },
    tooltip: 'Harmonic mean of precision and recall',
  },
  completeness_score: {
    id: 'completeness_score',
    name: 'Completeness',
    description: 'Overall completeness score',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.8, warning: 0.6, error: 0.4 },
    tooltip: 'Measures response depth and completeness',
  },
  is_valid_json: {
    id: 'is_valid_json',
    name: 'Valid JSON',
    description: 'JSON format validation',
    category: MetricCategory.VALIDATION,
    tooltip: 'Checks if the text is valid JSON format',
  },
  text_complexity: {
    id: 'text_complexity',
    name: 'Text Complexity',
    description: 'Overall text complexity score',
    category: MetricCategory.READABILITY,
    precision: 3,
    thresholds: { good: 0.3, warning: 0.6, error: 0.8 },
    tooltip:
      'Combined complexity metric based on vocabulary, sentence length, and readability',
  },
  bleu_score: {
    id: 'bleu_score',
    name: 'BLEU Score',
    description: 'N-gram overlap similarity with reference text',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.7, warning: 0.4, error: 0.2 },
    tooltip: 'Bilingual Evaluation Understudy score measuring text similarity using n-gram overlap',
  },
  rouge_1: {
    id: 'rouge_1',
    name: 'ROUGE-1',
    description: 'Unigram overlap with reference text',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.7, warning: 0.4, error: 0.2 },
    tooltip: 'ROUGE score using unigram overlap for word-level similarity',
  },
  rouge_2: {
    id: 'rouge_2',
    name: 'ROUGE-2',
    description: 'Bigram overlap with reference text',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.6, warning: 0.3, error: 0.1 },
    tooltip: 'ROUGE score using bigram overlap for phrase-level similarity',
  },
  rouge_l: {
    id: 'rouge_l',
    name: 'ROUGE-L',
    description: 'Longest common subsequence similarity',
    category: MetricCategory.QUALITY,
    precision: 3,
    thresholds: { good: 0.7, warning: 0.4, error: 0.2 },
    tooltip: 'ROUGE score based on longest common subsequence for structural similarity',
  },
};

// Formatters for different metric types
const formatters: Record<string, MetricFormatter> = {
  number: (
    value: unknown,
  ): { displayValue: string; hasError?: boolean; errorMessage?: string } => {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        displayValue: 'N/A',
        hasError: true,
        errorMessage: 'Invalid number value',
      };
    }
    return { displayValue: value.toFixed(2) };
  },

  percentage: (
    value: unknown,
  ): {
    displayValue: string;
    unit?: string;
    hasError?: boolean;
    errorMessage?: string;
  } => {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        displayValue: 'N/A',
        hasError: true,
        errorMessage: 'Invalid percentage value',
      };
    }
    return {
      displayValue: (value * 100).toFixed(1),
      unit: '%',
    };
  },

  boolean: (
    value: unknown,
  ): { displayValue: string; hasError?: boolean; errorMessage?: string } => {
    if (typeof value !== 'boolean') {
      return {
        displayValue: 'N/A',
        hasError: true,
        errorMessage: 'Invalid boolean value',
      };
    }
    return { displayValue: value ? 'Yes' : 'No' };
  },

  sentiment: (
    value: unknown,
    metricId?: string,
  ): { displayValue: string; hasError?: boolean; errorMessage?: string; isDisabled?: boolean } => {
    // Handle simple string sentiment (e.g., "positive", "negative", "neutral")
    if (typeof value === 'string') {
      return { displayValue: value };
    }

    // Handle object-based sentiment with label and confidence
    if (typeof value === 'object' && value !== null) {
      const sentiment = value as {
        label?: string;
        confidence?: number;
        score?: number;
        positive?: number;
        negative?: number;
        neutral?: number;
        disabled?: boolean;
        disabledReason?: string;
      };

      // Check if sentiment analysis was disabled
      if (sentiment.disabled) {
        const reason = sentiment.disabledReason || 'Disabled due to memory constraints';
        return {
          displayValue: `💭 ${reason}`,
          isDisabled: true,
        };
      }

      // For detailed sentiment with multiple scores
      if (
        sentiment.positive !== undefined &&
        sentiment.negative !== undefined &&
        sentiment.neutral !== undefined
      ) {
        const scores = {
          positive: sentiment.positive,
          negative: sentiment.negative,
          neutral: sentiment.neutral,
        };

        const maxEntry = Object.entries(scores).reduce((max, [key, val]) =>
          val > max[1] ? [key, val] : max,
        );

        // Format with proper capitalization
        const label =
          maxEntry[0].charAt(0).toUpperCase() + maxEntry[0].slice(1);

        // For detailed sentiment, show full breakdown
        if (metricId === 'sentiment_detailed') {
          const percentage = (maxEntry[1] * 100).toFixed(1);
          return {
            displayValue: `${label} (${percentage}%)`,
          };
        }

        // For regular sentiment, show just the word
        return {
          displayValue: label,
        };
      }

      // For simple sentiment object with label
      if (sentiment.label) {
        const confidence = sentiment.confidence || sentiment.score || 0;

        // For detailed sentiment, show confidence
        if (metricId === 'sentiment_detailed' && confidence > 0) {
          return {
            displayValue: `${sentiment.label} (${(confidence * 100).toFixed(1)}%)`,
          };
        }

        // For regular sentiment, show just the label
        return { displayValue: sentiment.label };
      }
    }

    return {
      displayValue: 'N/A',
      hasError: true,
      errorMessage: 'Invalid sentiment data',
    };
  },

  keywords: (
    value: unknown,
  ): { displayValue: string; hasError?: boolean; errorMessage?: string } => {
    if (typeof value !== 'object' || value === null) {
      return {
        displayValue: 'N/A',
        hasError: true,
        errorMessage: 'Invalid keywords data',
      };
    }

    const keywords = value as {
      found?: string[];
      missing?: string[];
      foundCount?: number;
      missingCount?: number;
      matchPercentage?: number;
    };

    if (
      typeof keywords.foundCount === 'number' &&
      typeof keywords.missingCount === 'number'
    ) {
      const total = keywords.foundCount + keywords.missingCount;
      const percentage =
        total > 0 ? ((keywords.foundCount / total) * 100).toFixed(1) : '0';
      return {
        displayValue: `${keywords.foundCount}/${total} (${percentage}%)`,
      };
    }

    return {
      displayValue: 'No data',
      hasError: true,
      errorMessage: 'Invalid keyword structure',
    };
  },
};

/**
 * Get appropriate formatter for a metric
 */
function getMetricFormatter(metricId: string, value: unknown): MetricFormatter {
  // Special formatters for specific metrics
  if (metricId.includes('sentiment')) {
    return formatters.sentiment;
  }
  if (metricId.includes('keyword')) {
    return formatters.keywords;
  }
  if (metricId === 'is_valid_json') {
    return formatters.boolean;
  }
  if (
    [
      'precision',
      'recall',
      'f_score',
      'vocab_diversity',
      'completeness_score',
      'bleu_score',
      'rouge_1',
      'rouge_2',
      'rouge_l',
    ].includes(metricId)
  ) {
    return formatters.percentage;
  }

  // Default to number formatter
  return formatters.number;
}

/**
 * Process a single metric into display format
 */
function processMetricItem(
  key: string,
  value: unknown,
  config?: MetricDisplayConfig,
): MetricDisplayItem {
  const metricConfig = config || METRIC_DISPLAY_CONFIG[key];
  const formatter = getMetricFormatter(key, value);
  const formatted = formatter(value, key);

  return {
    id: key,
    name:
      metricConfig?.name ||
      key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: formatted.displayValue,
    unit: formatted.unit || metricConfig?.unit,
    description: metricConfig?.description || '',
    originalValue: value,
    originalKey: key,
    category: metricConfig?.category || MetricCategory.CUSTOM,
    tooltip: metricConfig?.tooltip,
    hasError: formatted.hasError,
    errorMessage: formatted.errorMessage,
    isDisabled: formatted.isDisabled || false,
    colSpan: metricConfig?.colSpan || 1,
  };
}

/**
 * Group metrics by category
 */
function groupMetricsByCategory(metrics: MetricDisplayItem[]): MetricGroup[] {
  const groups = new Map<MetricCategory, MetricDisplayItem[]>();

  // Initialize all categories
  Object.values(MetricCategory).forEach((category) => {
    groups.set(category, []);
  });

  // Group metrics
  metrics.forEach((metric) => {
    const category = metric.category;
    const existing = groups.get(category) || [];
    existing.push(metric);
    groups.set(category, existing);
  });

  // Convert to MetricGroup array, filtering out empty groups
  return Array.from(groups.entries())
    .filter(([_, items]) => items.length > 0)
    .map(([category, items]) => ({
      category,
      title: getMetricCategoryTitle(category),
      description: getMetricCategoryDescription(category),
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
      isCollapsed: false,
      hasErrors: items.some((item) => item.hasError),
    }));
}

/**
 * Main metrics processing function
 * Replaces both metricsProcessor.ts and UnifiedPanelResults.tsx logic
 */
export function processMetrics(
  metricsData: MetricResult | Record<string, unknown> | null | undefined,
  options: MetricProcessingOptions = {},
): ProcessedMetricsResult {
  // Handle empty or invalid data
  if (!metricsData || typeof metricsData !== 'object') {
    return createEmptyMetricsResult();
  }

  const startTime = performance.now();
  const {
    includeDisabled = true,
    sortBy = 'name',
    sortOrder = 'asc',
    groupByCategory = true,
  } = options;

  try {
    // Convert metrics to display items
    const metricItems: MetricDisplayItem[] = [];
    let errorCount = 0;

    Object.entries(metricsData).forEach(([key, value]) => {
      // Skip error metrics (ending with _error)
      if (key.endsWith('_error')) {
        return;
      }

      try {
        const item = processMetricItem(key, value);

        if (item.hasError) {
          errorCount++;
        }

        if (includeDisabled || !item.isDisabled) {
          metricItems.push(item);
        }
      } catch (error) {
        errorCount++;
        console.warn(`Failed to process metric ${key}:`, error);
      }
    });

    // Sort metrics if requested
    if (sortBy !== 'category') {
      metricItems.sort((a, b) => {
        let aValue: string | number = a.name;
        let bValue: string | number = b.name;

        if (sortBy === 'value') {
          aValue = typeof a.value === 'number' ? a.value : String(a.value);
          bValue = typeof b.value === 'number' ? b.value : String(b.value);
        }

        const compareResult = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === 'asc' ? compareResult : -compareResult;
      });
    }

    // Group by category if requested
    const groups = groupByCategory
      ? groupMetricsByCategory(metricItems)
      : [
          {
            category: MetricCategory.CUSTOM,
            title: 'All Metrics',
            description: 'All available metrics',
            items: metricItems,
            isCollapsed: false,
            hasErrors: errorCount > 0,
          },
        ];

    return {
      groups,
      totalMetrics: metricItems.length,
      errorCount,
      processingTime: performance.now() - startTime,
      hasData: metricItems.length > 0,
    };
  } catch (error) {
    console.error('Failed to process metrics:', error);
    return {
      ...createEmptyMetricsResult(),
      errorCount: 1,
      processingTime: performance.now() - startTime,
    };
  }
}

/**
 * Get metric configuration by ID
 */
export function getMetricConfig(
  metricId: string,
): MetricDisplayConfig | undefined {
  return METRIC_DISPLAY_CONFIG[metricId];
}

/**
 * Check if metric has threshold violations
 */
export function hasThresholdViolation(
  item: MetricDisplayItem,
): 'good' | 'warning' | 'error' | null {
  const config = getMetricConfig(item.id);
  if (!config?.thresholds || typeof item.originalValue !== 'number') {
    return null;
  }

  const value = item.originalValue;
  const { good, warning, error } = config.thresholds;

  if (error !== undefined && value <= error) return 'error';
  if (warning !== undefined && value <= warning) return 'warning';
  if (good !== undefined && value >= good) return 'good';

  return null;
}
