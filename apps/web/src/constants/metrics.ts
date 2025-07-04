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
      'Analyzes the emotional tone of the text using DistilBERT (accurate) or VADER (fast), providing a score from -1 (negative) to 1 (positive).',
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
    name: 'Content Precision',
    description:
      'Measures how much of the LLM output is relevant compared to the input data.',
  },
  {
    id: 'recall',
    name: 'Content Recall',
    description:
      'Measures how much of the input data is covered in the LLM output.',
  },
  {
    id: 'f_score',
    name: 'Content F-Score',
    description:
      'Balanced measure of precision and recall for content comparison.',
  },
  {
    id: 'vocab_diversity',
    name: 'Vocabulary Diversity',
    description:
      'Measures unique words vs total words. Higher values indicate richer vocabulary.',
  },
  {
    id: 'completeness_score',
    name: 'Content Completeness',
    description:
      'Measures response depth and structure. Higher values indicate more complete responses.',
  },
];
