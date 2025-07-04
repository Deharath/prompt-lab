import { MetricOption } from '../components/MetricSelector.js';

/**
 * Available metrics that can be selected for evaluation.
 * Each metric includes:
 * - id: A unique identifier
 * - name: Display name
 * - description: User-friendly explanation of what the metric does
 * - requiresInput: Whether this metric requires additional user input
 * - inputLabel: Label for the input field (if requiresInput is true)
 * - inputPlaceholder: Placeholder text for the input field (if requiresInput is true)
 */
export const AVAILABLE_METRICS: MetricOption[] = [
  {
    id: 'flesch_reading_ease',
    name: 'Flesch Reading Ease',
    description:
      'Calculates how easy the text is to read based on sentence length and word complexity. Higher scores indicate easier readability.',
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description:
      'Analyzes the emotional tone of the text, providing a score from -1 (negative) to 1 (positive).',
  },
  {
    id: 'is_valid_json',
    name: 'JSON Validity',
    description:
      'Checks if the response is valid JSON. Useful when you expect structured data.',
  },
  {
    id: 'word_count',
    name: 'Word Count',
    description: 'Counts the number of words in the response.',
  },
  {
    id: 'keywords',
    name: 'Keyword Presence',
    description: 'Checks if specific keywords are present in the response.',
    requiresInput: true,
    inputLabel: 'Keywords (comma-separated)',
    inputPlaceholder: 'e.g., climate, sustainability, renewable',
  },
  {
    id: 'precision',
    name: 'Precision',
    description:
      'Measures the ratio of relevant content to total content. Higher values indicate more focused, relevant responses.',
  },
  {
    id: 'recall',
    name: 'Recall',
    description:
      'Measures completeness of the response. Higher values indicate the response covers more of the expected content.',
  },
  {
    id: 'f_score',
    name: 'F-Score',
    description:
      'Balanced measure combining precision and recall. Higher values indicate both relevant and complete responses.',
  },
];
