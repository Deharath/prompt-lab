/**
 * Shared metrics type definitions for frontend and backend consistency
 */

// Core metric input structure
import type { MetricDisplayConfig } from './results';

// API response interfaces
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

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

// Job-related types
export type JobStatus =
  | 'pending'
  | 'running'
  | 'evaluating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface JobSummary {
  id: string;
  status: JobStatus;
  createdAt: Date;
  provider: string;
  model: string;
  costUsd: number | null;

  resultSnippet: string | null; // First 100 chars of result for identification
}

// Pricing data centralized here
export const PRICING = {
  openai: {
    // Updated prices per 1K tokens with separate input/output rates
    'gpt-4.1-nano': { input: 0.0001, output: 0.0004 }, // $0.10/$0.40 per 1M
    'gpt-4.1-mini': { input: 0.0004, output: 0.0016 }, // $0.40/$1.60 per 1M
    'gpt-4.1': { input: 0.002, output: 0.008 }, // $2.00/$8.00 per 1M
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // $0.15/$0.60 per 1M
    'gpt-4o': { input: 0.0025, output: 0.01 }, // $2.50/$10.00 per 1M
    'gpt-4-turbo': { input: 0.01, output: 0.03 }, // $10.00/$30.00 per 1M
  },
  gemini: {
    'gemini-2.5-flash': { input: 0, output: 0 }, // Free tier
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 }, // $1.25/$5.00 per 1M
  },
  anthropic: {
    'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 }, // $0.80/$4.00 per 1M
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 }, // $3.00/$15.00 per 1M
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 }, // $15.00/$75.00 per 1M
  },
} as const;

export type ProviderPricing = typeof PRICING;

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

  // Advanced text similarity
  bleu_score?: number;
  rouge_1?: number;
  rouge_2?: number;
  rouge_l?: number;

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
  inputData?: unknown; // For conditional metrics
}

// Plugin system interfaces
export interface MetricPlugin {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  version: string;

  // Configuration
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;

  // Display
  displayConfig: MetricDisplayConfig;

  // Calculation
  calculate(
    text: string,
    input?: string,
    context?: MetricContext,
  ): Promise<unknown>;

  // Validation
  validate?(input?: string): boolean;

  // Dependencies (for ordering)
  dependencies?: string[];

  // Feature flags
  isExperimental?: boolean;
  requiresMemory?: number; // MB
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
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
