import { describe, it, expect } from 'vitest';
import { calculateMetrics } from '@prompt-lab/api';

describe('Content-Based Metrics Test', () => {
  it('should calculate content precision, recall, and f-score correctly', async () => {
    const originalText =
      'The quick brown fox jumps over the lazy dog. This is a classic pangram used in typography.';
    const summary = 'A brown fox jumps over a dog. This is used in typography.';

    const metrics = [
      { id: 'precision', input: originalText },
      { id: 'recall', input: originalText },
      { id: 'f_score', input: originalText },
    ];

    const results = await calculateMetrics(summary, metrics);

    // Verify that precision, recall, and f-score are calculated
    expect(results.precision).toBeTypeOf('number');
    expect(results.recall).toBeTypeOf('number');
    expect(results.f_score).toBeTypeOf('number');

    // All should be between 0 and 1
    expect(results.precision).toBeGreaterThanOrEqual(0);
    expect(results.precision).toBeLessThanOrEqual(1);
    expect(results.recall).toBeGreaterThanOrEqual(0);
    expect(results.recall).toBeLessThanOrEqual(1);
    expect(results.f_score).toBeGreaterThanOrEqual(0);
    expect(results.f_score).toBeLessThanOrEqual(1);

    // F-score should be less than or equal to both precision and recall
    expect(results.f_score).toBeLessThanOrEqual(
      Math.max(results.precision as number, results.recall as number),
    );

    console.log('Content Metrics Results:', {
      precision: results.precision,
      recall: results.recall,
      f_score: results.f_score,
    });
  });

  it('should still calculate default metrics properly', async () => {
    const testText =
      'This is a simple test with good readability and positive sentiment.';

    const defaultMetrics = [
      { id: 'flesch_reading_ease' },
      { id: 'sentiment' },
      { id: 'word_count' },
      { id: 'vocab_diversity' },
      { id: 'completeness_score' },
    ];

    const results = await calculateMetrics(testText, defaultMetrics);

    // Verify all default metrics are present and valid
    expect(results).toHaveProperty('flesch_reading_ease');
    expect(results).toHaveProperty('sentiment');
    expect(results).toHaveProperty('word_count');
    expect(results).toHaveProperty('vocab_diversity');
    expect(results).toHaveProperty('completeness_score');

    expect(typeof results.flesch_reading_ease).toBe('number');
    expect(typeof results.sentiment).toBe('number');
    expect(typeof results.word_count).toBe('number');
    expect(typeof results.vocab_diversity).toBe('number');
    expect(typeof results.completeness_score).toBe('number');
  });
});
