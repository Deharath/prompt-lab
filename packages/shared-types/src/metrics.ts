/**
 * Shared metrics type definitions for frontend and backend consistency
 */

// Core metric input structure
export interface MetricInput {
  id: string;
  input?: string; // For keywords and other parameterized metrics
  weight?: number; // For weighted calculations
}

// Legacy support for frontend components
export interface SelectedMetric extends MetricInput {}

// Metric configuration for UI
export interface MetricOption {
  id: string;
  name: string;
  description: string;
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  category?: MetricCategory;
}

// Metric categories for organization
export enum MetricCategory {
  READABILITY = 'readability',
  SENTIMENT = 'sentiment',
  CONTENT = 'content',
  STRUCTURE = 'structure',
  QUALITY = 'quality',
  KEYWORDS = 'keywords',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom',
}

// Strongly typed metric result values
export interface MetricResult {
  // Readability metrics
  flesch_reading_ease?: number;
  flesch_kincaid_grade?: number;
  smog_index?: number;

  // Sentiment metrics
  sentiment?: SentimentResult;
  sentiment_detailed?: DetailedSentimentResult;

  // Content metrics
  word_count?: number;
  sentence_count?: number;
  avg_words_per_sentence?: number;
  vocab_diversity?: number;
  token_count?: number;

  // Performance metrics
  response_latency?: number;

  // Keywords and search
  keywords?: KeywordResult;
  weighted_keywords?: KeywordResult;

  // Content analysis
  precision?: number;
  recall?: number;
  f_score?: number;
  completeness_score?: number;

  // Structure validation
  is_valid_json?: boolean;

  // Custom metrics (extensible)
  [key: string]: unknown;
}

// Sentiment analysis result
export interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}

// Detailed sentiment breakdown
export interface DetailedSentimentResult {
  positive: number;
  negative: number;
  neutral: number;
  compound: number;
  label: 'positive' | 'negative' | 'neutral';
}

// Keyword analysis result
export interface KeywordResult {
  found: string[];
  missing: string[];
  foundCount: number;
  missingCount: number;
  matchPercentage: number;
  totalMatches: number;
}

// Keyword weight configuration
export interface KeywordWeight {
  keyword: string;
  weight: number;
}

// Metric calculation context
export interface MetricContext {
  text: string;
  selectedMetrics: MetricInput[];
  disabledMetrics?: Set<string>;
  referenceText?: string; // For precision/recall calculations
}

// Error handling for metrics
export interface MetricError {
  metricId: string;
  error: string;
  fallbackValue?: unknown;
}

// Metrics calculation result with error handling
export interface MetricsCalculationResult {
  results: MetricResult;
  errors: MetricError[];
  processingTime: number;
}

// Type guards for metric results
export function isSentimentResult(value: unknown): value is SentimentResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    'score' in value &&
    'confidence' in value
  );
}

export function isKeywordResult(value: unknown): value is KeywordResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'found' in value &&
    'missing' in value &&
    'foundCount' in value &&
    'missingCount' in value
  );
}

// Metric validation utilities
export function isValidMetricInput(input: unknown): input is MetricInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    'id' in input &&
    typeof (input as MetricInput).id === 'string'
  );
}

export function validateMetricInputs(inputs: unknown[]): MetricInput[] {
  return inputs.filter(isValidMetricInput);
}

// Type guard for MetricsCalculationResult
export function isMetricsCalculationResult(
  value: unknown,
): value is MetricsCalculationResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'results' in value &&
    'errors' in value &&
    'processingTime' in value &&
    Array.isArray((value as MetricsCalculationResult).errors) &&
    typeof (value as MetricsCalculationResult).processingTime === 'number'
  );
}

// Type guard for MetricResult
export function isMetricResult(value: unknown): value is MetricResult {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Helper function to extract results from either format
export function extractMetricResults(value: unknown): MetricResult {
  if (isMetricsCalculationResult(value)) {
    return value.results;
  }
  if (isMetricResult(value)) {
    return value;
  }
  return {};
}
