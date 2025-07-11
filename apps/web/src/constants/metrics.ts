import { MetricOption, MetricCategory } from '../types/metrics.js';

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
export const AVAILABLE_METRICS: MetricOption[] = [
  {
    id: 'flesch_reading_ease',
    name: 'Flesch Reading Ease',
    description:
      'Calculates how easy the text is to read based on sentence length and word complexity. Higher scores indicate easier readability.',
    category: MetricCategory.READABILITY,
  },
  {
    id: 'flesch_kincaid_grade',
    name: 'Flesch-Kincaid Grade Level',
    description:
      'Indicates the U.S. school grade level needed to understand the text.',
    category: MetricCategory.READABILITY,
  },
  {
    id: 'smog_index',
    name: 'SMOG Index',
    description:
      'Simple Measure of Gobbledygook - estimates years of education needed to understand the text.',
    category: MetricCategory.READABILITY,
  },
  {
    id: 'sentiment_detailed',
    name: 'Detailed Sentiment Analysis',
    description:
      'Breakdown of positive, negative, and neutral sentiment with confidence scores for each emotion.',
    category: MetricCategory.SENTIMENT,
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description:
      'Analyzes emotional tone using Xenova Twitter RoBERTa (accurate) or VADER (fast), providing positive/negative/neutral classification.',
    category: MetricCategory.SENTIMENT,
  },
  {
    id: 'is_valid_json',
    name: 'JSON Validity',
    description:
      'Checks if the response is valid JSON. Useful when you expect structured data.',
    category: MetricCategory.STRUCTURE,
  },
  {
    id: 'word_count',
    name: 'Word Count',
    description: 'Counts the number of words in the response.',
    category: MetricCategory.STRUCTURE,
  },
  {
    id: 'token_count',
    name: 'Token Count',
    description: 'Counts the total number of tokens in the response.',
    category: MetricCategory.STRUCTURE,
  },
  {
    id: 'sentence_count',
    name: 'Sentence Count',
    description: 'Counts the number of sentences in the response.',
    category: MetricCategory.STRUCTURE,
  },
  {
    id: 'avg_words_per_sentence',
    name: 'Average Words per Sentence',
    description: 'Calculates the average number of words per sentence.',
    category: MetricCategory.STRUCTURE,
  },
  {
    id: 'keywords',
    name: 'Keyword Presence',
    description: 'Checks if specific keywords are present in the response.',
    requiresInput: true,
    inputLabel: 'Keywords (comma-separated)',
    inputPlaceholder: 'e.g., climate, sustainability, renewable',
    category: MetricCategory.CONTENT,
  },
  {
    id: 'weighted_keywords',
    name: 'Weighted Keywords',
    description: 'Keyword analysis with importance weights for each keyword.',
    requiresInput: true,
    inputLabel: 'Weighted Keywords (JSON)',
    inputPlaceholder:
      '[{"keyword": "climate", "weight": 2}, {"keyword": "sustainability", "weight": 1}]',
    category: MetricCategory.CONTENT,
  },
  {
    id: 'precision',
    name: 'Content Precision',
    description:
      'Measures how much of the LLM output is relevant compared to the input data.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'recall',
    name: 'Content Recall',
    description:
      'Measures how much of the input data is covered in the LLM output.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'f_score',
    name: 'Content F-Score',
    description:
      'Balanced measure of precision and recall for content comparison.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'bleu_score',
    name: 'BLEU Score',
    description:
      'Bilingual Evaluation Understudy score measuring n-gram overlap with reference text. Higher scores indicate better similarity.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'rouge_1',
    name: 'ROUGE-1',
    description:
      'Recall-Oriented Understudy for Gisting Evaluation using unigram overlap. Measures word-level similarity.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'rouge_2',
    name: 'ROUGE-2',
    description:
      'ROUGE score using bigram overlap. Captures phrase-level similarity and word order.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'rouge_l',
    name: 'ROUGE-L',
    description:
      'ROUGE score based on longest common subsequence. Measures structural similarity and text flow.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'vocab_diversity',
    name: 'Vocabulary Diversity',
    description:
      'Measures unique words vs total words. Higher values indicate richer vocabulary.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'completeness_score',
    name: 'Content Completeness',
    description:
      'Measures response depth and structure. Higher values indicate more complete responses.',
    category: MetricCategory.QUALITY,
  },
  {
    id: 'text_complexity',
    name: 'Text Complexity',
    description:
      'Combined complexity metric based on vocabulary, sentence length, and readability.',
    category: MetricCategory.READABILITY,
  },
  {
    id: 'response_latency',
    name: 'Response Latency',
    description: 'Time taken to generate the response (in milliseconds).',
    category: MetricCategory.PERFORMANCE,
  },
];
