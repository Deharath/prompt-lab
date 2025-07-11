import { MetricOption, MetricCategory } from '@prompt-lab/shared-types';

/**
 * Available metrics that can be selected for evaluation.
 * Each metric includes:
 * - id: A unique identifier
 * - name: Display name
 * - description: User-friendly explanation of what the metric does
 * - requiresInput: Whether this metric requires additional user input
 * - inputLabel: Label for the input field (if requiresInput is true)
 * - inputPlaceholder: Placeholder text for the input field (if requiresInput is true)
 * - category: Metric category for organization
 */
/**
 * Generate available metrics from the plugin registry
 */
function generateAvailableMetrics(): MetricOption[] {
  // Return a static list of metrics for now
  // In a real implementation, this would fetch from the API
  return [
    {
      id: 'word_count',
      name: 'Word Count',
      description: 'Total number of words in the text',
      category: MetricCategory.CONTENT,
    },
    {
      id: 'sentence_count',
      name: 'Sentence Count',
      description: 'Total number of sentences in the text',
      category: MetricCategory.CONTENT,
    },
    {
      id: 'flesch_reading_ease',
      name: 'Flesch Reading Ease',
      description: 'Text readability score (0-100, higher = easier)',
      category: MetricCategory.READABILITY,
    },
    {
      id: 'flesch_kincaid_grade',
      name: 'Flesch-Kincaid Grade Level',
      description: 'Grade level required to understand the text',
      category: MetricCategory.READABILITY,
    },
    {
      id: 'sentiment',
      name: 'Sentiment Analysis',
      description:
        'Overall sentiment of the text (positive, negative, neutral)',
      category: MetricCategory.SENTIMENT,
    },
    {
      id: 'keywords',
      name: 'Keyword Match',
      description: 'Check if specific keywords appear in the text',
      requiresInput: true,
      inputLabel: 'Keywords (comma-separated)',
      inputPlaceholder: 'Enter keywords separated by commas',
      category: MetricCategory.KEYWORDS,
    },
    {
      id: 'precision',
      name: 'Precision',
      description: 'Precision score compared to reference text',
      category: MetricCategory.QUALITY,
    },
    {
      id: 'recall',
      name: 'Recall',
      description: 'Recall score compared to reference text',
      category: MetricCategory.QUALITY,
    },
    {
      id: 'f_score',
      name: 'F-Score',
      description: 'F1 score combining precision and recall',
      category: MetricCategory.QUALITY,
    },
    {
      id: 'bleu_score',
      name: 'BLEU Score',
      description: 'BLEU score for text similarity evaluation',
      category: MetricCategory.QUALITY,
    },
    {
      id: 'rouge_1',
      name: 'ROUGE-1',
      description: 'ROUGE-1 score for summarization quality',
      category: MetricCategory.QUALITY,
    },
    {
      id: 'rouge_2',
      name: 'ROUGE-2',
      description: 'ROUGE-2 score for summarization quality',
      category: MetricCategory.QUALITY,
    },
    {
      id: 'rouge_l',
      name: 'ROUGE-L',
      description: 'ROUGE-L score for summarization quality',
      category: MetricCategory.QUALITY,
    },
    {
      id: 'token_count',
      name: 'Token Count',
      description: 'Number of tokens in the text',
      category: MetricCategory.CONTENT,
    },
    {
      id: 'response_latency',
      name: 'Response Latency',
      description: 'Time taken to generate the response',
      category: MetricCategory.PERFORMANCE,
    },
  ];
}
export const AVAILABLE_METRICS: MetricOption[] = generateAvailableMetrics();
