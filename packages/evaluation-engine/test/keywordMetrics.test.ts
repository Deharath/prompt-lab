/**
 * Phase 2 - Task 2.1: Core Services Unit Tests
 * keywordMetrics.test.ts - Test keyword matching, weighting, and scoring
 */

import { describe, it, expect } from 'vitest';
import {
  calculateKeywordMetrics,
  type KeywordWeight,
} from '../src/lib/keywordMetrics.js';

describe('Keyword Metrics', () => {
  describe('calculateKeywordMetrics - basic functionality', () => {
    it('should return zero metrics for empty input', () => {
      const result = calculateKeywordMetrics('', []);

      expect(result.precision).toBe(0);
      expect(result.recall).toBe(0);
      expect(result.f_score).toBe(0);
      expect(result.totalMatches).toBe(0);
      expect(result.weightedScore).toBe(0);
      expect(result.matches).toEqual([]);
    });

    it('should calculate metrics for simple keyword matching', () => {
      const text =
        'Climate change affects renewable energy and sustainability efforts.';
      const keywords = ['climate', 'renewable', 'sustainability'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.precision).toBeGreaterThan(0);
      expect(result.totalMatches).toBe(3); // All keywords should be found
      expect(result.matches).toHaveLength(3);
      expect(result.matches[0].keyword).toBe('climate');
      expect(result.matches[0].count).toBe(1);
    });

    it('should handle case-insensitive matching', () => {
      const text = 'CLIMATE change affects RENEWABLE energy.';
      const keywords = ['climate', 'renewable'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.totalMatches).toBe(2);
      expect(result.precision).toBe(1); // All keywords found
    });

    it('should handle partial keyword matches', () => {
      const text = 'I love programming and development work.';
      const keywords = ['programming', 'development', 'testing'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.totalMatches).toBe(2); // 'programming' and 'development' found
      expect(result.precision).toBeCloseTo(2 / 3); // 2 out of 3 keywords found
    });

    it('should handle plural and singular forms', () => {
      const text =
        'I love cats and dogs. The cats are sleeping while dogs play.';
      const keywords = ['cat', 'dog'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.totalMatches).toBeGreaterThan(0);
      // Should find both 'cats' (plural of 'cat') and 'dogs' (plural of 'dog')
      const catMatch = result.matches.find((m) => m.keyword === 'cat');
      const dogMatch = result.matches.find((m) => m.keyword === 'dog');

      expect(catMatch?.count).toBeGreaterThan(0);
      expect(dogMatch?.count).toBeGreaterThan(0);
    });

    it('should handle accented characters', () => {
      const text = 'José works at the café and writes résumés.';
      const keywords = ['jose', 'cafe', 'resumes'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.totalMatches).toBe(3);
      expect(result.precision).toBe(1); // All keywords should match despite accents
    });
  });

  describe('calculateKeywordMetrics - weighted keywords', () => {
    it('should calculate weighted scores correctly', () => {
      const text = 'AI and machine learning are transforming technology.';
      const weightedKeywords: KeywordWeight[] = [
        { keyword: 'AI', weight: 2.0 },
        { keyword: 'machine', weight: 1.5 },
        { keyword: 'technology', weight: 1.0 },
        { keyword: 'blockchain', weight: 0.5 }, // Not in text
      ];

      const result = calculateKeywordMetrics(text, weightedKeywords);

      expect(result.matches).toHaveLength(4);

      const aiMatch = result.matches.find((m) => m.keyword === 'AI');
      const machineMatch = result.matches.find((m) => m.keyword === 'machine');
      const techMatch = result.matches.find((m) => m.keyword === 'technology');
      const blockchainMatch = result.matches.find(
        (m) => m.keyword === 'blockchain',
      );

      expect(aiMatch?.weight).toBe(2.0);
      expect(aiMatch?.count).toBe(1);
      expect(aiMatch?.weightedScore).toBe(2.0);

      expect(machineMatch?.weight).toBe(1.5);
      expect(machineMatch?.count).toBe(1);
      expect(machineMatch?.weightedScore).toBe(1.5);

      expect(techMatch?.weight).toBe(1.0);
      expect(techMatch?.count).toBe(1);

      expect(blockchainMatch?.count).toBe(0);
      expect(blockchainMatch?.weightedScore).toBe(0);

      expect(result.weightedScore).toBeGreaterThan(0);
    });

    it('should handle mixed string and weighted keyword formats', () => {
      const text = 'Python programming with data science applications.';
      const keywords = [
        'python',
        { keyword: 'data', weight: 2.0 },
        'programming',
      ];

      const result = calculateKeywordMetrics(text, keywords as any);

      expect(result.matches).toHaveLength(3);

      const dataMatch = result.matches.find((m) => m.keyword === 'data');
      expect(dataMatch?.weight).toBe(2.0);

      const pythonMatch = result.matches.find((m) => m.keyword === 'python');
      expect(pythonMatch?.weight).toBe(1); // Default weight for string keywords
    });
  });

  describe('precision, recall, and f-score calculations', () => {
    it('should calculate perfect precision and recall', () => {
      const text = 'The quick brown fox jumps over the lazy dog.';
      const keywords = ['quick', 'fox', 'dog'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.precision).toBe(1); // All keywords found
      expect(result.recall).toBe(1); // All keywords found
      expect(result.f_score).toBe(1); // Perfect F1 score
    });

    it('should calculate partial precision and recall', () => {
      const text = 'The quick brown fox.';
      const keywords = ['quick', 'fox', 'elephant', 'tiger'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.precision).toBe(0.5); // 2 out of 4 keywords found
      expect(result.recall).toBe(0.5); // Same as precision in this case
      expect(result.f_score).toBeCloseTo(0.5); // F1 = 2 * (0.5 * 0.5) / (0.5 + 0.5)
    });

    it('should handle zero matches correctly', () => {
      const text = 'The quick brown fox.';
      const keywords = ['elephant', 'tiger', 'lion'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.precision).toBe(0);
      expect(result.recall).toBe(0);
      expect(result.f_score).toBe(0);
      expect(result.totalMatches).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const keywords = ['test', 'example'];
      const result = calculateKeywordMetrics('', keywords);

      expect(result.precision).toBe(0);
      expect(result.recall).toBe(0);
      expect(result.totalMatches).toBe(0);
    });

    it('should handle empty keywords', () => {
      const text = 'This is some test text.';
      const result = calculateKeywordMetrics(text, []);

      expect(result.precision).toBe(0);
      expect(result.recall).toBe(0);
      expect(result.matches).toEqual([]);
    });

    it('should handle special characters in keywords', () => {
      const text = 'The C++ programming language uses object-oriented design.';
      const keywords = ['C++', 'object-oriented'];

      const result = calculateKeywordMetrics(text, keywords);

      // Should handle special characters in keyword matching
      expect(result.totalMatches).toBeGreaterThan(0);
    });

    it('should handle very long text efficiently', () => {
      const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(
        1000,
      );
      const keywords = ['quick', 'fox', 'dog'];

      const start = performance.now();
      const result = calculateKeywordMetrics(longText, keywords);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // Should complete in under 500ms
      expect(result.totalMatches).toBeGreaterThan(2000); // Many matches in repeated text
    });

    it('should not match partial words within larger words', () => {
      const text = 'The cat catalog contains catastrophic information.';
      const keywords = ['cat'];

      const result = calculateKeywordMetrics(text, keywords);

      // Should only match 'cat' as a complete word, not as part of 'catalog' or 'catastrophic'
      expect(result.totalMatches).toBe(1);

      const catMatch = result.matches.find((m) => m.keyword === 'cat');
      expect(catMatch?.count).toBe(1);
    });

    it('should handle numbers and alphanumeric keywords', () => {
      const text = 'Version 3.14 of the API supports HTTP/2 protocol.';
      const keywords = ['3.14', 'API', 'HTTP'];

      const result = calculateKeywordMetrics(text, keywords);

      expect(result.totalMatches).toBeGreaterThan(0);
    });
  });

  describe('performance and stress tests', () => {
    it('should handle large keyword lists efficiently', () => {
      const text =
        'Technology, AI, programming, development, software, coding, algorithms, data.';
      const keywords = [
        'technology',
        'AI',
        'programming',
        'development',
        'software',
        'coding',
        'algorithms',
        'data',
        'machine',
        'learning',
        'neural',
        'networks',
        'database',
        'frontend',
        'backend',
        'API',
        'framework',
        'library',
        'testing',
        'deployment',
      ];

      const start = performance.now();
      const result = calculateKeywordMetrics(text, keywords);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(result.matches).toHaveLength(keywords.length);
      expect(result.totalMatches).toBeGreaterThan(5);
    });
  });
});
