export const metricConfig: Record<
  string,
  { category: string; displayName: string; description: string }
> = {
  f_score: {
    category: 'quality',
    displayName: 'Content F-Score',
    description: 'Balanced measure of content precision and recall',
  },
  precision: {
    category: 'quality',
    displayName: 'Content Precision',
    description: 'How much of the output is relevant to the input',
  },
  recall: {
    category: 'quality',
    displayName: 'Content Recall',
    description: 'How much of the input is covered in the output',
  },
  vocab_diversity: {
    category: 'quality',
    displayName: 'Vocabulary Diversity',
    description: 'Unique words vs total words ratio',
  },
  completeness_score: {
    category: 'quality',
    displayName: 'Content Completeness',
    description: 'Response depth and structure quality',
  },
  keyword_precision: {
    category: 'quality',
    displayName: 'Legacy Keyword Precision',
    description: 'From keywords metric breakdown',
  },
  keyword_recall: {
    category: 'quality',
    displayName: 'Legacy Keyword Recall',
    description: 'From keywords metric breakdown',
  },
  keyword_f_score: {
    category: 'quality',
    displayName: 'Legacy Keyword F-Score',
    description: 'From keywords metric breakdown',
  },
  bert_score: {
    category: 'quality',
    displayName: 'BERT Score',
    description: 'Semantic similarity (Task 5 - optional microservice)',
  },
  flesch_reading_ease: {
    category: 'readability',
    displayName: 'Flesch Reading Ease',
    description:
      'Text readability via text-readability-ts (0-100, higher = easier)',
  },
  flesch_kincaid: {
    category: 'readability',
    displayName: 'Flesch-Kincaid Grade',
    description: 'Reading grade level required (FRE/FK via Task 2)',
  },
  smog: {
    category: 'readability',
    displayName: 'SMOG Index',
    description: 'Simple Measure of Gobbledygook (Task 2 implementation)',
  },
  text_complexity: {
    category: 'readability',
    displayName: 'Text Complexity',
    description: 'Overall complexity score based on vocabulary and structure',
  },
  sentiment: {
    category: 'sentiment',
    displayName: 'Sentiment Score',
    description:
      'Xenova Twitter RoBERTa (accurate) or VADER (fast) based on SENTIMENT_MODE env',
  },
  sentiment_detailed: {
    category: 'sentiment',
    displayName: 'Detailed Sentiment',
    description:
      'Full sentiment breakdown with positive/negative/neutral confidence scores',
  },
  word_count: {
    category: 'content',
    displayName: 'Word Count',
    description: 'Word count via wink-tokenizer wrapper',
  },
  sentence_count: {
    category: 'content',
    displayName: 'Sentence Count',
    description: 'Sentence count from text analysis',
  },
  avg_words_per_sentence: {
    category: 'content',
    displayName: 'Avg Words/Sentence',
    description: 'Average sentence length metric',
  },
  keywords: {
    category: 'content',
    displayName: 'Keywords',
    description: 'Keyword matching with optional weighting (Task 4)',
  },
  is_valid_json: {
    category: 'technical',
    displayName: 'Valid JSON',
    description: 'JSON validity check for structured output',
  },
  response_time_ms: {
    category: 'technical',
    displayName: 'Response Time',
    description: 'Latency tracking (Task 6 - basic logging)',
  },
  estimated_cost_usd: {
    category: 'technical',
    displayName: 'Estimated Cost',
    description: 'Cost tracking for budgeting purposes',
  },
};
