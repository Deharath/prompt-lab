/**
 * Test the actual implemented metrics services to ensure they work
 */

import { describe, it, expect } from 'vitest';
import { calculateReadabilityScores } from '../src/lib/readabilityService.js';
import { analyzeSentiment } from '../src/lib/sentimentService.js';
import { calculateKeywordMetrics } from '../src/lib/keywordMetrics.js';
import { textWorker } from '../src/lib/textWorker.js';

describe('Actual Metrics Implementation Tests', () => {
  describe('Text Worker', () => {
    it('should tokenize text correctly', () => {
      const text = 'Hello world! This is a test.';
      const tokens = textWorker.tokenize(text);
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should analyze text correctly', () => {
      const text = '  Hello World!  \n\t';
      const stats = textWorker.analyzeText(text);
      expect(stats).toHaveProperty('wordCount');
      expect(stats.wordCount).toBeGreaterThan(0);
    });
  });

  describe('Readability Service', () => {
    it('should calculate FRE score', () => {
      const text = 'This is a simple sentence. It should be easy to read.';
      const metrics = calculateReadabilityScores(text);

      expect(metrics).toHaveProperty('fleschReadingEase');
      expect(typeof metrics.fleschReadingEase).toBe('number');
      expect(metrics.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(metrics.fleschReadingEase).toBeLessThanOrEqual(100);
    });

    it('should calculate Flesch-Kincaid Grade', () => {
      const text = 'This is a simple sentence. It should be easy to read.';
      const metrics = calculateReadabilityScores(text);

      expect(metrics).toHaveProperty('fleschKincaid');
      expect(typeof metrics.fleschKincaid).toBe('number');
    });
  });

  describe('Sentiment Service', () => {
    it('should detect positive sentiment for "love"', async () => {
      const text = 'I love this amazing product!';
      const result = await analyzeSentiment(text);

      expect(typeof result.compound).toBe('number');
      expect(result.compound).toBeGreaterThan(0.5);
    });

    it('should detect negative sentiment for "hate"', async () => {
      const text = 'I hate this terrible product!';
      const result = await analyzeSentiment(text);

      expect(typeof result.compound).toBe('number');
      expect(result.compound).toBeLessThan(-0.5);
    });

    it('should handle neutral sentiment', async () => {
      const text = 'The sky is blue.';
      const result = await analyzeSentiment(text);

      expect(typeof result.compound).toBe('number');
      expect(result.compound).toBeGreaterThanOrEqual(-1);
      expect(result.compound).toBeLessThanOrEqual(1);
    });
  });

  describe('Keyword Metrics', () => {
    it('should calculate basic keyword metrics', () => {
      const text =
        'Climate change affects renewable energy and sustainability efforts.';
      const keywords = ['climate', 'renewable', 'sustainability'];

      const metrics = calculateKeywordMetrics(text, keywords);

      expect(metrics).toHaveProperty('precision');
      expect(metrics).toHaveProperty('recall');
      expect(metrics).toHaveProperty('f_score');
      expect(metrics.precision).toBeGreaterThanOrEqual(0);
      expect(metrics.precision).toBeLessThanOrEqual(1);
      expect(metrics.recall).toBeGreaterThanOrEqual(0);
      expect(metrics.recall).toBeLessThanOrEqual(1);
    });

    it('should handle weighted keywords', () => {
      const text =
        'This excellent product has amazing features at a good price.';
      const keywords = [
        { keyword: 'excellent', weight: 2 },
        { keyword: 'amazing', weight: 2 },
        { keyword: 'price', weight: 1 },
      ];

      const metrics = calculateKeywordMetrics(text, keywords);

      expect(metrics).toHaveProperty('precision');
      expect(metrics).toHaveProperty('recall');
      expect(typeof metrics.precision).toBe('number');
      expect(typeof metrics.recall).toBe('number');
    });

    it('should handle plural forms', () => {
      const text = 'The cats and dogs are playing in the gardens.';
      const keywords = ['cat', 'dog', 'garden'];

      const metrics = calculateKeywordMetrics(text, keywords);

      expect(metrics.recall).toBeGreaterThan(0);
    });
  });
});
