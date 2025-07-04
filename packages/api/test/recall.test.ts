/**
 * Test suite for Content-Based Recall metric
 * Tests the new unified metrics system
 */

import { describe, it, expect } from 'vitest';
import { calculateMetrics, type MetricInput } from '../src/lib/metrics.js';

describe('Content-Based Recall Metrics', () => {
  describe('Basic Content Recall', () => {
    it('should calculate recall based on word overlap', async () => {
      const prediction = 'The cat sat on the mat';
      const referenceText = 'The dog sat on the floor mat';

      const metrics: MetricInput[] = [{ id: 'recall', input: referenceText }];

      const result = await calculateMetrics(prediction, metrics);

      // Should find overlap: "the", "sat", "on", "mat" = 4/6 reference words ≈ 0.67
      expect(result.recall).toBeGreaterThan(0);
      expect(result.recall).toBeLessThanOrEqual(1);
    });

    it('should handle perfect recall match', async () => {
      const text = 'The quick brown fox jumps over lazy dog';
      const referenceText = 'The quick brown fox jumps over lazy dog';

      const metrics: MetricInput[] = [{ id: 'recall', input: referenceText }];

      const result = await calculateMetrics(text, metrics);

      expect(result.recall).toBe(1.0);
    });

    it('should handle no overlap', async () => {
      const prediction = 'apple banana cherry';
      const referenceText = 'dog cat mouse';

      const metrics: MetricInput[] = [{ id: 'recall', input: referenceText }];

      const result = await calculateMetrics(prediction, metrics);

      expect(result.recall).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty inputs', async () => {
      const metrics: MetricInput[] = [{ id: 'recall', input: '' }];

      const result = await calculateMetrics('', metrics);

      expect(result.recall).toBe(0);
    });

    it('should handle missing reference text', async () => {
      const metrics: MetricInput[] = [
        { id: 'recall' }, // No input provided
      ];

      const result = await calculateMetrics('some text', metrics);

      expect(result.recall).toBe(0);
    });

    it('should normalize text properly', async () => {
      const prediction = 'THE Cat! sat? on... the MAT.';
      const referenceText = 'the cat sat on the mat';

      const metrics: MetricInput[] = [{ id: 'recall', input: referenceText }];

      const result = await calculateMetrics(prediction, metrics);

      // Should achieve perfect recall after normalization
      expect(result.recall).toBe(1.0);
    });
  });

  describe('Content-Based F-Score (uses recall)', () => {
    it('should calculate f-score using precision and recall', async () => {
      const prediction = 'The cat sat on the mat';
      const referenceText = 'The dog sat on the floor mat';

      const metrics: MetricInput[] = [{ id: 'f_score', input: referenceText }];

      const result = await calculateMetrics(prediction, metrics);

      expect(result.f_score).toBeGreaterThan(0);
      expect(result.f_score).toBeLessThanOrEqual(1);
    });

    it('should handle perfect f-score', async () => {
      const text = 'The quick brown fox';
      const referenceText = 'The quick brown fox';

      const metrics: MetricInput[] = [{ id: 'f_score', input: referenceText }];

      const result = await calculateMetrics(text, metrics);

      expect(result.f_score).toBe(1.0);
    });
  });

  describe('Multiple Metrics Integration', () => {
    it('should calculate recall alongside other metrics', async () => {
      const prediction = 'The cat sat on the mat happily';
      const referenceText = 'The dog sat on the floor mat';

      const metrics: MetricInput[] = [
        { id: 'recall', input: referenceText },
        { id: 'precision', input: referenceText },
        { id: 'f_score', input: referenceText },
        { id: 'flesch_reading_ease' },
      ];

      const result = await calculateMetrics(prediction, metrics);

      expect(result.recall).toBeDefined();
      expect(result.precision).toBeDefined();
      expect(result.f_score).toBeDefined();
      expect(result.flesch_reading_ease).toBeDefined();

      // Verify relationships
      expect(typeof result.recall).toBe('number');
      expect(typeof result.precision).toBe('number');
      expect(typeof result.f_score).toBe('number');
    });
  });
});
