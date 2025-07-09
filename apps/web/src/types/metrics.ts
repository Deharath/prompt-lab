// Re-export shared types for frontend compatibility
export {
  type MetricOption,
  type SelectedMetric,
  type MetricInput,
  type MetricResult,
  type MetricsCalculationResult,
  type MetricError,
  type SentimentResult,
  type DetailedSentimentResult,
  type KeywordResult,
  type KeywordWeight,
  MetricCategory,
  isSentimentResult,
  isKeywordResult,
  isValidMetricInput,
  validateMetricInputs,
} from '@prompt-lab/shared-types';
