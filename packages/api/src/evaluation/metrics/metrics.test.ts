// NOTE: This file is not included in any tsconfig.json. If you want to lint or type-check it, add it to the appropriate tsconfig include array.

import { describe, it, expect } from 'vitest';
import {
  calculateFleschReadingEase,
  calculateSentiment,
  checkJsonValidity,
  countWords,
  checkForKeywords,
  calculatePrecision,
  calculateRecall,
  calculateFScore,
  calculateMockLatency,
} from './metrics.js';

describe('Metrics Library', () => {
  describe('calculateFleschReadingEase', () => {
    it('should return a score between 0 and 100 for standard text', () => {
      const text =
        'The quick brown fox jumps over the lazy dog. This is a simple test of the Flesch Reading Ease score.';
      const result = calculateFleschReadingEase(text);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle edge case of empty text', () => {
      expect(calculateFleschReadingEase('')).toBe(0);
    });

    it('should calculate higher scores for simpler text', () => {
      const simpleText = 'I like to read. Books are fun. Reading is good.';
      const complexText =
        'The utilization of sophisticated linguistic constructs often correlates with diminished readability metrics according to established computational evaluations of textual complexity.';

      const simpleScore = calculateFleschReadingEase(simpleText);
      const complexScore = calculateFleschReadingEase(complexText);

      expect(simpleScore).toBeGreaterThan(complexScore);
    });
  });

  describe('calculateSentiment', () => {
    it('should return positive values for positive text', () => {
      const text = 'I love this product! It is amazing and works perfectly.';
      const result = calculateSentiment(text);

      expect(result).toBeGreaterThan(0);
    });

    it('should return negative values for negative text', () => {
      const text = 'This is terrible. I hate how poorly it works.';
      const result = calculateSentiment(text);

      expect(result).toBeLessThan(0);
    });

    it('should handle negations', () => {
      const text = 'This is not good at all.';
      const result = calculateSentiment(text);

      expect(result).toBeLessThanOrEqual(0);
    });

    it('should return 0 for neutral or empty text', () => {
      expect(calculateSentiment('')).toBe(0);
      expect(
        calculateSentiment('The sky is blue and the grass is green.'),
      ).toBe(0);
    });
  });

  describe('checkJsonValidity', () => {
    it('should return isValid=true for valid JSON objects', () => {
      const validJson = '{"name": "John", "age": 30}';
      const result = checkJsonValidity(validJson);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should return isValid=true for valid JSON arrays', () => {
      const validArray = '[1, 2, 3, "test"]';
      const result = checkJsonValidity(validArray);

      expect(result.isValid).toBe(true);
    });

    it('should return isValid=false with error for invalid JSON', () => {
      const invalidJson = '{name: "John", age: 30}'; // Missing quotes around keys
      const result = checkJsonValidity(invalidJson);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });

    it('should handle primitive values appropriately', () => {
      // JSON.parse works on primitives but we want to reject them as not "objects"
      const primitiveJson = '"just a string"';
      const result = checkJsonValidity(primitiveJson);

      expect(result.isValid).toBe(false);
    });

    it('should handle empty input', () => {
      const result = checkJsonValidity('');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Empty input');
    });
  });

  describe('countWords', () => {
    it('should count words correctly in a standard text', () => {
      const text = 'The quick brown fox jumps over the lazy dog.';
      const result = countWords(text);

      expect(result).toBe(9);
    });

    it('should handle multiple spaces between words', () => {
      const text = 'Multiple   spaces    between     words';
      const result = countWords(text);

      expect(result).toBe(4);
    });

    it('should return 0 for empty text', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });
  });

  describe('checkForKeywords', () => {
    it('should identify present keywords correctly', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const keywords = ['quick', 'fox', 'elephant'];
      const result = checkForKeywords(text, keywords);

      expect(result.found).toContain('quick');
      expect(result.found).toContain('fox');
      expect(result.missing).toContain('elephant');
      expect(result.foundCount).toBe(2);
      expect(result.missingCount).toBe(1);
      expect(result.matchPercentage).toBe((2 / 3) * 100);
    });

    it('should be case-insensitive', () => {
      const text = 'The Quick Brown Fox';
      const keywords = ['quick', 'brown'];
      const result = checkForKeywords(text, keywords);

      expect(result.foundCount).toBe(2);
    });

    it('should handle empty inputs', () => {
      const emptyTextResult = checkForKeywords('', ['keyword']);
      expect(emptyTextResult.foundCount).toBe(0);

      const emptyKeywordsResult = checkForKeywords(
        'Text with no keywords to check',
        [],
      );
      expect(emptyKeywordsResult.foundCount).toBe(0);
      expect(emptyKeywordsResult.matchPercentage).toBe(0);
    });
  });

  describe('calculatePrecision', () => {
    it('should calculate precision correctly for keyword-based classification', () => {
      const prediction = 'The weather is sunny and warm';
      const reference = 'It is sunny today';
      const keywords = ['sunny', 'warm', 'cold'];

      // Prediction has: sunny, warm (2 keywords)
      // Reference has: sunny (1 keyword)
      // True positives: sunny (1)
      // Precision = TP / (TP + FP) = 1 / 2 = 0.5
      const result = calculatePrecision(prediction, reference, keywords);
      expect(result).toBeCloseTo(0.5);
    });

    it('should calculate word-level precision when no keywords provided', () => {
      const prediction = 'the cat sat on mat';
      const reference = 'the dog sat on chair';

      // Prediction words: the, cat, sat, on, mat (5)
      // Reference words: the, dog, sat, on, chair
      // Common words: the, sat, on (3)
      // Precision = 3 / 5 = 0.6
      const result = calculatePrecision(prediction, reference);
      expect(result).toBeCloseTo(0.6);
    });

    it('should return 0 for empty inputs', () => {
      expect(calculatePrecision('', 'reference')).toBe(0);
      expect(calculatePrecision('prediction', '')).toBe(0);
    });
  });

  describe('calculateRecall', () => {
    it('should calculate recall correctly for keyword-based classification', () => {
      const prediction = 'The weather is sunny';
      const reference = 'It is sunny and warm today';
      const keywords = ['sunny', 'warm', 'cold'];

      // Prediction has: sunny (1 keyword)
      // Reference has: sunny, warm (2 keywords)
      // True positives: sunny (1)
      // Recall = TP / (TP + FN) = 1 / 2 = 0.5
      const result = calculateRecall(prediction, reference, keywords);
      expect(result).toBeCloseTo(0.5);
    });

    it('should calculate word-level recall when no keywords provided', () => {
      const prediction = 'the cat sat on';
      const reference = 'the dog sat on chair';

      // Prediction words: the, cat, sat, on
      // Reference words: the, dog, sat, on, chair (5)
      // Common words: the, sat, on (3)
      // Recall = 3 / 5 = 0.6
      const result = calculateRecall(prediction, reference);
      expect(result).toBeCloseTo(0.6);
    });

    it('should return 0 for empty inputs', () => {
      expect(calculateRecall('', 'reference')).toBe(0);
      expect(calculateRecall('prediction', '')).toBe(0);
    });
  });

  describe('calculateFScore', () => {
    it('should calculate F-score as harmonic mean of precision and recall', () => {
      const prediction = 'the cat sat';
      const reference = 'the dog sat on chair';

      // Word-level calculation:
      // Precision = 2/3 ≈ 0.667 (the, sat are common out of 3 prediction words)
      // Recall = 2/5 = 0.4 (the, sat are common out of 5 reference words)
      // F-score = 2 * (0.667 * 0.4) / (0.667 + 0.4) ≈ 0.5
      const result = calculateFScore(prediction, reference);
      expect(result).toBeCloseTo(0.5, 1);
    });

    it('should return 0 when precision and recall are both 0', () => {
      const result = calculateFScore('xyz', 'abc');
      expect(result).toBe(0);
    });

    it('should return 0 for empty inputs', () => {
      expect(calculateFScore('', 'reference')).toBe(0);
      expect(calculateFScore('prediction', '')).toBe(0);
    });
  });
  describe('calculateMockLatency', () => {
    it('should return higher latency for longer text', () => {
      const shortText = 'Hello world';
      const longText =
        'This is a much longer text with many more words and much more content to process for the evaluation system';

      const shortLatency = calculateMockLatency(shortText);
      const longLatency = calculateMockLatency(longText);

      // More robust test - long text should generally have higher latency
      expect(longLatency).toBeGreaterThan(shortLatency);
    });

    it('should return higher latency for more complex text', () => {
      const simpleText = 'I like cats. Cats are fun. They play all day.';
      const complexText =
        'The utilization of sophisticated linguistic constructs demonstrates enhanced computational complexity.';

      const simpleLatency = calculateMockLatency(simpleText);
      const complexLatency = calculateMockLatency(complexText);

      expect(complexLatency).toBeGreaterThan(simpleLatency);
    });

    it('should return 0 for empty text', () => {
      expect(calculateMockLatency('')).toBe(0);
      expect(calculateMockLatency('   ')).toBe(0);
    });

    it('should return a reasonable latency value', () => {
      const text = 'This is a sample text for testing';
      const latency = calculateMockLatency(text);

      expect(latency).toBeGreaterThan(0);
      expect(latency).toBeLessThan(10000); // Should be reasonable
    });
  });
});
