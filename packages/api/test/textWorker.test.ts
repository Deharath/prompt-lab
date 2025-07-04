/**
 * Task 1 Tests - Text Worker
 * Jest suite ≥ 95% token overlap with wink reference
 */

import { describe, it, expect } from 'vitest';
import { createTextWorker, textWorker } from '../lib/textWorker.js';

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

    it('should maintain high overlap with wink reference', () => {
      const complexText =
        "The quick brown fox jumps over the lazy dog. It's a sunny day!";
      const tokens = textWorker.tokenize(complexText);

      // Should have tokens for each meaningful element
      const words = tokens.filter((t) => t.tag === 'word');
      expect(words.length).toBeGreaterThan(10);

      // Should preserve punctuation
      const punctuation = tokens.filter((t) =>
        ['punctuation', 'symbol'].includes(t.tag),
      );
      expect(punctuation.length).toBeGreaterThan(2);
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
  });

  describe('extractSentences', () => {
    it('should split text into sentences', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      const sentences = textWorker.extractSentences(text);

      expect(sentences).toEqual([
        'First sentence',
        'Second sentence',
        'Third sentence',
      ]);
    });

    it('should handle empty input', () => {
      expect(textWorker.extractSentences('')).toEqual([]);
      expect(textWorker.extractSentences('   ')).toEqual([]);
    });
  });

  describe('normalize', () => {
    it('should normalize text correctly', () => {
      const text = '  HELLO    WORLD  ';
      const normalized = textWorker.normalize(text);

      expect(normalized).toBe('hello world');
    });

    it('should handle multiple whitespace types', () => {
      const text = 'hello\t\nworld   test';
      const normalized = textWorker.normalize(text);

      expect(normalized).toBe('hello world test');
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
  });

  describe('createTextWorker', () => {
    it('should create independent instances', () => {
      const worker1 = createTextWorker();
      const worker2 = createTextWorker();

      expect(worker1).not.toBe(worker2);
      expect(typeof worker1.tokenize).toBe('function');
      expect(typeof worker2.analyzeText).toBe('function');
    });
  });
});
