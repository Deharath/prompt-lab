/**
 * Phase 2 - Task 2.2: Orchestrator Integration Tests
 * metrics.test.ts - Test the main calculateMetrics orchestrator
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { calculateMetrics, getAvailableMetrics } from '../src/lib/metrics.js';
import { initializeMetrics } from '../src/metrics/index.js';

// Mock transformers module for sentiment analysis
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
}));

// Mock node-fetch to prevent actual HTTP calls during tests
vi.mock('node-fetch', () => ({
  __esModule: true,
  default: vi.fn(),
}));

describe('Metrics Orchestrator', () => {
  beforeAll(async () => {
    // Initialize metrics registry before running tests
    await initializeMetrics();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up transformers mock to return positive sentiment for positive text
    const transformersModule = await import('@huggingface/transformers');
    const mockPipeline = vi.fn().mockResolvedValue([
      { label: 'LABEL_2', score: 0.8 }, // positive
      { label: 'LABEL_1', score: 0.15 }, // neutral
      { label: 'LABEL_0', score: 0.05 }, // negative
    ]);
    (vi.mocked(transformersModule.pipeline) as any).mockResolvedValue(
      mockPipeline,
    );

    // Set up node-fetch mock to return sentiment API responses
    const nodeFetch = await import('node-fetch');
    const mockFetch = vi.mocked(nodeFetch.default);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          compound: 0.8,
          positive: 0.8,
          negative: 0.1,
          neutral: 0.1,
          label: 'positive',
          confidence: 0.9,
          mode: 'accurate',
        },
      }),
    } as any);
  });
  describe('calculateMetrics', () => {
    it('should return empty object for empty input', async () => {
      const result = await calculateMetrics('', []);
      expect(result.results).toEqual({});
      expect(result.errors).toHaveLength(1); // Should have validation error
      expect(result.errors[0].metricId).toBe('validation');
    });

    it('should return empty object for no metrics', async () => {
      const result = await calculateMetrics('Test text', []);
      expect(result.results).toEqual({});
      expect(result.errors).toEqual([]);
    });

    it('should calculate readability metrics', async () => {
      const text = 'This is a simple test sentence. It should be easy to read.';
      const metrics = [
        { id: 'flesch_reading_ease' },
        { id: 'flesch_kincaid_grade' },
        { id: 'smog_index' },
      ];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.flesch_reading_ease).toBeGreaterThanOrEqual(0);
      expect(result.results.flesch_reading_ease).toBeLessThanOrEqual(100);
      expect(result.results.flesch_kincaid_grade).toBeGreaterThanOrEqual(0);
      expect(result.results.smog_index).toBeGreaterThanOrEqual(0);
    });

    it('should calculate sentiment metrics', async () => {
      const text = 'I love this amazing product! It works perfectly.';
      const metrics = [{ id: 'sentiment' }, { id: 'sentiment_detailed' }];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.sentiment).toBeDefined();
      expect(result.results.sentiment.score).toBeGreaterThanOrEqual(-1);
      expect(result.results.sentiment.score).toBeLessThanOrEqual(1);
      expect(result.results.sentiment.label).toMatch(
        /positive|negative|neutral/,
      );

      expect(result.results.sentiment_detailed).toHaveProperty('compound');
      expect(result.results.sentiment_detailed).toHaveProperty('positive');
      expect(result.results.sentiment_detailed).toHaveProperty('negative');
      expect(result.results.sentiment_detailed).toHaveProperty('neutral');
      expect(result.results.sentiment_detailed).toHaveProperty('label');
    });

    it('should calculate content metrics', async () => {
      const text =
        'This is a test. It has multiple sentences. Each sentence contains words.';
      const metrics = [
        { id: 'word_count' },
        { id: 'sentence_count' },
        { id: 'avg_words_per_sentence' },
      ];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.word_count).toBe(12);
      expect(result.results.sentence_count).toBe(3);
      expect(result.results.avg_words_per_sentence).toBeCloseTo(12 / 3);
    });

    it('should validate JSON content', async () => {
      const validJson = '{"name": "test", "value": 123}';
      const invalidJson = '{name: test, value: 123}';

      const validResult = await calculateMetrics(validJson, [
        { id: 'is_valid_json' },
      ]);
      const invalidResult = await calculateMetrics(invalidJson, [
        { id: 'is_valid_json' },
      ]);

      expect(validResult.results.is_valid_json).toBe(true);
      expect(invalidResult.results.is_valid_json).toBe(false);
    });

    it('should calculate keyword metrics with input', async () => {
      const text =
        'Climate change affects renewable energy and sustainability efforts.';
      const metrics = [
        { id: 'keywords', input: 'climate,renewable,sustainability' },
      ];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.keywords).toHaveProperty('found');
      expect(result.results.keywords).toHaveProperty('missing');
      expect(result.results.keywords).toHaveProperty('foundCount');
      expect(result.results.keywords).toHaveProperty('missingCount');
      expect(result.results.keywords).toHaveProperty('matchPercentage');

      const keywords = result.results.keywords as any;
      expect(keywords.found).toContain('climate');
      expect(keywords.found).toContain('renewable');
      expect(keywords.found).toContain('sustainability');
      expect(keywords.foundCount).toBe(3);
      expect(keywords.matchPercentage).toBe(100);
    });

    it('should calculate weighted keyword metrics', async () => {
      const text = 'AI and machine learning are transforming technology.';
      const weightedKeywordsInput = JSON.stringify([
        { keyword: 'AI', weight: 2.0 },
        { keyword: 'machine', weight: 1.5 },
        { keyword: 'technology', weight: 1.0 },
      ]);
      const metrics = [
        { id: 'weighted_keywords', input: weightedKeywordsInput },
      ];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.weighted_keywords).toHaveProperty('found');
      expect(result.results.weighted_keywords).toHaveProperty('missing');
      expect(result.results.weighted_keywords).toHaveProperty('foundCount');
      expect(result.results.weighted_keywords).toHaveProperty('missingCount');
      expect(result.results.weighted_keywords).toHaveProperty(
        'matchPercentage',
      );

      const weightedKeywordsResult = result.results.weighted_keywords as any;
      expect(weightedKeywordsResult.foundCount).toBeGreaterThan(0); // Should find keywords
    });

    it('should calculate precision and recall with reference text', async () => {
      const output = 'The quick brown fox jumps over the lazy dog.';
      const reference = 'A fast brown fox leaps over a sleepy dog.';
      const metrics = [
        { id: 'precision', input: reference },
        { id: 'recall', input: reference },
        { id: 'f_score', input: reference },
      ];

      const result = await calculateMetrics(output, metrics);

      expect(result.results.precision).toBeGreaterThanOrEqual(0);
      expect(result.results.precision).toBeLessThanOrEqual(1);
      expect(result.results.recall).toBeGreaterThanOrEqual(0);
      expect(result.results.recall).toBeLessThanOrEqual(1);
      expect(result.results.f_score).toBeGreaterThanOrEqual(0);
      expect(result.results.f_score).toBeLessThanOrEqual(1);
    });

    it('should calculate vocabulary diversity', async () => {
      const text = 'The cat sat on the mat. The cat was happy.';
      const metrics = [{ id: 'vocab_diversity' }];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.vocab_diversity).toBeGreaterThan(0);
      expect(result.results.vocab_diversity).toBeLessThanOrEqual(1);
      // Should be less than 1 due to repeated words 'the' and 'cat'
      expect(result.results.vocab_diversity).toBeLessThan(1);
    });

    it('should calculate completeness score', async () => {
      const text =
        'This is a comprehensive analysis of the complex computational algorithms used in modern machine learning applications.';
      const metrics = [{ id: 'completeness_score' }];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.completeness_score).toBeGreaterThan(0);
      expect(result.results.completeness_score).toBeLessThanOrEqual(1);
    });

    it('should calculate text complexity', async () => {
      const simpleText = 'The cat sat on the mat.';
      const complexText =
        'The lexicographical methodology employed in this comprehensive analysis necessitates sophisticated computational algorithms.';

      const simpleResult = await calculateMetrics(simpleText, [
        { id: 'text_complexity' },
      ]);
      const complexResult = await calculateMetrics(complexText, [
        { id: 'text_complexity' },
      ]);

      expect(simpleResult.results.text_complexity).toBeGreaterThanOrEqual(0);
      expect(complexResult.results.text_complexity).toBeGreaterThanOrEqual(0);
      expect(Number(complexResult.results.text_complexity)).toBeGreaterThan(
        Number(simpleResult.results.text_complexity),
      );
    });

    it('should handle multiple metrics efficiently', async () => {
      const text =
        'This is a comprehensive test of the metrics system. It should calculate multiple metrics simultaneously.';
      const metrics = [
        { id: 'flesch_reading_ease' },
        { id: 'sentiment' },
        { id: 'word_count' },
        { id: 'sentence_count' },
        { id: 'vocab_diversity' },
        { id: 'text_complexity' },
      ];

      const start = performance.now();
      const result = await calculateMetrics(text, metrics);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(Object.keys(result.results)).toHaveLength(6); // Just the 6 requested metrics
      expect(result.results.flesch_reading_ease).toBeDefined();
      expect(result.results.sentiment).toBeDefined();
      expect(result.results.word_count).toBeDefined();
      expect(result.results.sentence_count).toBeDefined();
      expect(result.results.vocab_diversity).toBeDefined();
      expect(result.results.text_complexity).toBeDefined();
    });

    it('should handle unknown metrics gracefully', async () => {
      const text = 'Test text';
      const metrics = [
        { id: 'word_count' },
        { id: 'unknown_metric' },
        { id: 'sentiment' },
      ];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.word_count).toBeDefined();
      expect(result.results.sentiment).toBeDefined();
      expect(result.results.unknown_metric).toBeUndefined();
      // Unknown metrics are handled silently - no warning is logged
    });

    it('should handle errors gracefully', async () => {
      const text = 'Test text';
      const metrics = [
        { id: 'weighted_keywords', input: 'invalid json' }, // Invalid JSON
      ];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.weighted_keywords).toHaveProperty('found');
      expect(result.results.weighted_keywords).toHaveProperty('missing');
      // Error should be handled gracefully with empty result structure
      // Errors are handled gracefully - no console.error logging needed
    });
  });

  describe('getAvailableMetrics', () => {
    it('should return list of available metrics', () => {
      const metrics = getAvailableMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(10);

      // Check for required metrics
      const metricIds = metrics.map((m) => m.id);
      expect(metricIds).toContain('flesch_reading_ease');
      expect(metricIds).toContain('sentiment');
      expect(metricIds).toContain('word_count');
      expect(metricIds).toContain('keywords');

      // Check metric structure
      metrics.forEach((metric) => {
        expect(metric).toHaveProperty('id');
        expect(metric).toHaveProperty('name');
        expect(metric).toHaveProperty('description');
        expect(typeof metric.id).toBe('string');
        expect(typeof metric.name).toBe('string');
        expect(typeof metric.description).toBe('string');
      });
    });

    it('should include metrics that require input', () => {
      const metrics = getAvailableMetrics();

      const keywordsMetric = metrics.find((m) => m.id === 'keywords');
      const precisionMetric = metrics.find((m) => m.id === 'precision');

      expect(keywordsMetric?.requiresInput).toBe(true);
      expect(precisionMetric?.requiresInput).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very long text', async () => {
      const longText = 'This is a test sentence. '.repeat(1000);
      const metrics = [{ id: 'word_count' }, { id: 'flesch_reading_ease' }];

      const result = await calculateMetrics(longText, metrics);

      expect(result.results.word_count).toBeGreaterThan(4000);
      expect(result.results.flesch_reading_ease).toBeGreaterThanOrEqual(0);
    });

    it('should handle text with only whitespace', async () => {
      const text = '   \n\t   ';
      const metrics = [{ id: 'word_count' }, { id: 'sentence_count' }];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.word_count).toBe(0);
      expect(result.results.sentence_count).toBe(0);
    });

    it('should handle special characters and emojis', async () => {
      const text = 'Hello 👋 world! 🌍 This has emojis 😊 and symbols @#$%';
      const metrics = [{ id: 'word_count' }, { id: 'sentiment' }];

      const result = await calculateMetrics(text, metrics);

      expect(result.results.word_count).toBeGreaterThan(0);
      expect(result.results.sentiment).toBeDefined();
      expect(result.results.sentiment.score).toBeGreaterThanOrEqual(-1);
      expect(result.results.sentiment.score).toBeLessThanOrEqual(1);
    });
  });
});
