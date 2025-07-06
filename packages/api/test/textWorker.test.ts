/**
 * Phase 2 - Task 2.1: Core Services Unit Tests
 * textWorker.test.ts - Test text preprocessing and tokenization utilities
 */

import { describe, it, expect } from 'vitest';
import { createTextWorker, textWorker } from '../src/lib/textWorker.js';

describe('Text Worker', () => {
  describe('tokenize', () => {
    it('should tokenize simple text correctly', () => {
      const result = textWorker.tokenize('Hello, world!');

      expect(result).toHaveLength(4); // Hello, comma, world, exclamation
      expect(result[0].value).toBe('Hello');
      expect(result[0].tag).toBe('word');
      expect(result[1].value).toBe(',');
      expect(result[2].value).toBe('world');
      expect(result[2].tag).toBe('word');
      expect(result[3].value).toBe('!');
    });

    it('should handle empty or invalid input', () => {
      expect(textWorker.tokenize('')).toEqual([]);
      expect(textWorker.tokenize('   ')).toEqual([]);
    });

    it('should tokenize complex text with punctuation', () => {
      const complexText =
        "The quick brown fox jumps over the lazy dog. It's a sunny day!";
      const tokens = textWorker.tokenize(complexText);

      // Should have tokens for each meaningful element
      const words = tokens.filter((t) => t.tag === 'word');
      expect(words.length).toBeGreaterThan(10);

      // Should preserve punctuation (at least period and exclamation)
      const punctuation = tokens.filter((t) =>
        ['punctuation', 'symbol'].includes(t.tag),
      );
      expect(punctuation.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle special characters and numbers', () => {
      const tokens = textWorker.tokenize('Price: $123.45 (USD)');
      expect(tokens.length).toBeGreaterThan(4);

      const hasPrice = tokens.some((t) => t.value === 'Price');
      const hasNumber = tokens.some(
        (t) => t.tag === 'number' || t.value.includes('123'),
      );
      expect(hasPrice).toBe(true);
    });
  });

  describe('extractWords', () => {
    it('should extract only words from tokens', () => {
      const tokens = textWorker.tokenize('Hello, beautiful world!');
      const words = textWorker.extractWords(tokens);

      expect(words).toEqual(['hello', 'beautiful', 'world']);
    });

    it('should normalize words to lowercase', () => {
      const tokens = textWorker.tokenize('HELLO World');
      const words = textWorker.extractWords(tokens);

      expect(words).toEqual(['hello', 'world']);
    });

    it('should filter out punctuation and spaces', () => {
      const tokens = textWorker.tokenize('Hello!!! World??? Test...');
      const words = textWorker.extractWords(tokens);

      expect(words).toEqual(['hello', 'world', 'test']);
    });
  });

  describe('extractSentences', () => {
    it('should extract sentences correctly', () => {
      const sentences = textWorker.extractSentences(
        'Hello world. How are you? I am fine!',
      );

      expect(sentences).toHaveLength(3);
      expect(sentences[0]).toBe('Hello world');
      expect(sentences[1]).toBe('How are you');
      expect(sentences[2]).toBe('I am fine');
    });

    it('should handle single sentence', () => {
      const sentences = textWorker.extractSentences('This is one sentence');

      expect(sentences).toHaveLength(1);
      expect(sentences[0]).toBe('This is one sentence');
    });

    it('should handle empty input', () => {
      expect(textWorker.extractSentences('')).toEqual([]);
    });

    it('should handle multiple punctuation marks', () => {
      const sentences = textWorker.extractSentences(
        'Really??? Yes!!! Amazing...',
      );

      expect(sentences.length).toBeGreaterThan(0);
      expect(sentences[0]).toBe('Really');
    });
  });

  describe('normalize', () => {
    it('should normalize text to lowercase and trim whitespace', () => {
      const result = textWorker.normalize('  HELLO   WORLD  ');
      expect(result).toBe('hello world');
    });

    it('should handle empty or invalid input', () => {
      expect(textWorker.normalize('')).toBe('');
      expect(textWorker.normalize('   ')).toBe('');
    });

    it('should normalize multiple spaces to single spaces', () => {
      const result = textWorker.normalize('hello     world    test');
      expect(result).toBe('hello world test');
    });
  });

  describe('analyzeText', () => {
    it('should provide comprehensive text statistics', () => {
      const text = 'Hello world. This is a test. It works great!';
      const stats = textWorker.analyzeText(text);

      expect(stats.wordCount).toBe(9);
      expect(stats.sentenceCount).toBe(3);
      expect(stats.avgWordsPerSentence).toBeCloseTo(3);
      expect(stats.words).toContain('hello');
      expect(stats.words).toContain('world');
      expect(stats.sentences).toHaveLength(3);
    });

    it('should handle single sentence', () => {
      const text = 'Single sentence here';
      const stats = textWorker.analyzeText(text);

      expect(stats.wordCount).toBe(3);
      expect(stats.sentenceCount).toBe(1);
      expect(stats.avgWordsPerSentence).toBe(3);
    });

    it('should handle empty text', () => {
      const stats = textWorker.analyzeText('');

      expect(stats.wordCount).toBe(0);
      expect(stats.sentenceCount).toBe(0);
      expect(stats.avgWordsPerSentence).toBe(0);
      expect(stats.words).toEqual([]);
      expect(stats.sentences).toEqual([]);
    });

    it('should analyze complex text correctly', () => {
      const text =
        'The quick brown fox jumps over the lazy dog! How now brown cow? The end.';
      const stats = textWorker.analyzeText(text);

      expect(stats.wordCount).toBeGreaterThan(10);
      expect(stats.sentenceCount).toBe(3);
      expect(stats.avgWordsPerSentence).toBeGreaterThan(3);
    });
  });

  describe('normalizeForMatching', () => {
    it('should normalize text for keyword matching', () => {
      const result = textWorker.normalizeForMatching('Café naïve résumé');

      // Should remove accents and convert to lowercase
      expect(result).toBe('cafe naive resume');
    });

    it('should handle punctuation and special characters', () => {
      const result = textWorker.normalizeForMatching('Hello, world!!! @#$%');

      expect(result).toBe('hello world');
    });

    it('should normalize whitespace', () => {
      const result = textWorker.normalizeForMatching('   hello    world   ');

      expect(result).toBe('hello world');
    });
  });

  describe('generateKeywordVariations', () => {
    it('should generate plural variations', () => {
      const variations = textWorker.generateKeywordVariations('cat');

      expect(variations).toContain('cat');
      expect(variations).toContain('cats');
    });

    it('should generate verb tense variations', () => {
      const variations = textWorker.generateKeywordVariations('running');

      expect(variations).toContain('running');
      expect(variations).toContain('run');
    });

    it('should handle words ending in y', () => {
      const variations = textWorker.generateKeywordVariations('city');

      expect(variations).toContain('city');
      expect(variations).toContain('cities');
    });

    it('should handle already plural words', () => {
      const variations = textWorker.generateKeywordVariations('cats');

      expect(variations).toContain('cats');
      expect(variations).toContain('cat');
    });
  });

  describe('findKeywordMatchesWithBoundaries', () => {
    it('should find exact word matches', () => {
      const matches = textWorker.findKeywordMatchesWithBoundaries(
        'I love cats and dogs',
        'cat',
      );

      expect(matches).toContain('cats');
    });

    it('should not match partial words', () => {
      const matches = textWorker.findKeywordMatchesWithBoundaries(
        'The cat is in the catalog',
        'cat',
      );

      expect(matches).toContain('cat');
      expect(matches).not.toContain('catalog'); // Should not match substring
    });

    it('should handle case insensitive matching', () => {
      const matches = textWorker.findKeywordMatchesWithBoundaries(
        'CATS and Dogs',
        'cat',
      );

      expect(matches).toContain('cats');
    });

    it('should handle plural matching', () => {
      const matches = textWorker.findKeywordMatchesWithBoundaries(
        'I have many cats',
        'cat',
      );

      expect(matches).toContain('cats');
    });
  });

  describe('createTextWorker', () => {
    it('should create independent instances', () => {
      const worker1 = createTextWorker();
      const worker2 = createTextWorker();

      expect(worker1).not.toBe(worker2);
      expect(typeof worker1.tokenize).toBe('function');
      expect(typeof worker2.analyzeText).toBe('function');
    });

    it('should have all required methods', () => {
      const worker = createTextWorker();

      expect(typeof worker.tokenize).toBe('function');
      expect(typeof worker.extractWords).toBe('function');
      expect(typeof worker.extractSentences).toBe('function');
      expect(typeof worker.normalize).toBe('function');
      expect(typeof worker.analyzeText).toBe('function');
      expect(typeof worker.normalizeForMatching).toBe('function');
      expect(typeof worker.generateKeywordVariations).toBe('function');
      expect(typeof worker.findKeywordMatchesWithBoundaries).toBe('function');
    });
  });

  describe('performance tests', () => {
    it('should tokenize large text efficiently', () => {
      const largeText =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(
          1000,
        );

      const start = performance.now();
      const tokens = textWorker.tokenize(largeText);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(tokens.length).toBeGreaterThan(1000);
    });

    it('should analyze large text efficiently', () => {
      const largeText = 'This is a test sentence. '.repeat(500);

      const start = performance.now();
      const stats = textWorker.analyzeText(largeText);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // Should complete in under 200ms
      expect(stats.wordCount).toBeGreaterThan(2000);
    });
  });
});
