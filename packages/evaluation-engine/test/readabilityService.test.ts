/**
 * Phase 2 - Task 2.1: Core Services Unit Tests
 * readabilityService.test.ts - Test readability calculations and 20kB size validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  calculateReadabilityScores,
  readabilityHandler,
  validateTextSize,
} from '../src/lib/readabilityService.js';

describe('Readability Service', () => {
  describe('calculateReadabilityScores', () => {
    it('should return zero scores for empty text', async () => {
      const result = await calculateReadabilityScores('');

      expect(result.fleschReadingEase).toBe(0);
      expect(result.fleschKincaid).toBe(0);
      expect(result.smog).toBe(0);
      expect(result.textLength).toBe(0);
    });

    it('should calculate readability scores for simple text', async () => {
      const simpleText = 'The cat sat on the mat. It was a nice day.';
      const result = await calculateReadabilityScores(simpleText);

      expect(result.fleschReadingEase).toBeGreaterThan(50); // Simple text should be easier to read
      expect(result.fleschKincaid).toBeGreaterThanOrEqual(0);
      expect(result.smog).toBeGreaterThanOrEqual(0);
      expect(result.textLength).toBe(simpleText.length);
    });

    it('should calculate readability scores for complex text', async () => {
      const complexText =
        'The lexicographical methodology employed in this comprehensive analysis necessitates sophisticated computational algorithms to facilitate accurate linguistic assessment.';
      const result = await calculateReadabilityScores(complexText);

      expect(result.fleschReadingEase).toBeLessThan(60); // Complex text should be harder to read
      expect(result.fleschKincaid).toBeGreaterThan(5); // Higher grade level
      expect(result.smog).toBeGreaterThanOrEqual(0);
      expect(result.textLength).toBe(complexText.length);
    });

    it('should enforce score boundaries', async () => {
      const result = await calculateReadabilityScores('Test text here.');

      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.fleschReadingEase).toBeLessThanOrEqual(100);
      expect(result.fleschKincaid).toBeGreaterThanOrEqual(0);
      expect(result.smog).toBeGreaterThanOrEqual(0);
    });

    it('should handle text with markdown and formatting', async () => {
      const markdownText =
        '# Heading\n\n**Bold text** and *italic text*. `Code block` here.\n\n- List item 1\n- List item 2';
      const result = await calculateReadabilityScores(markdownText);

      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.fleschKincaid).toBeGreaterThanOrEqual(0);
      expect(result.textLength).toBe(markdownText.length);
    });

    it('should handle special characters and emojis', async () => {
      const specialText = 'Hello! 😊 This text has special chars: @#$%^&*()';
      const result = await calculateReadabilityScores(specialText);

      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.fleschKincaid).toBeGreaterThanOrEqual(0);
      expect(result.textLength).toBe(specialText.length);
    });
  });

  describe('validateTextSize middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      next = vi.fn();
    });

    it('should allow text under 20kB', () => {
      req.body = { text: 'Valid text under 20kB limit' };

      validateTextSize(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject text over 20kB with 413', () => {
      const largeText = 'a'.repeat(21 * 1024); // 21KB
      req.body = { text: largeText };

      validateTextSize(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Text too large. Maximum size is 20480 bytes, received 21504 bytes.',
        code: 'TEXT_TOO_LARGE',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing text gracefully', () => {
      req.body = {};

      validateTextSize(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle non-string text', () => {
      req.body = { text: 123 };

      validateTextSize(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should calculate text size correctly for unicode characters', () => {
      const unicodeText = '🚀'.repeat(6000); // Each emoji is 4 bytes
      req.body = { text: unicodeText };

      validateTextSize(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(413);
    });
  });

  describe('readabilityHandler', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
    });

    it('should return readability scores for valid text', async () => {
      req.body = { text: 'This is a test sentence for readability analysis.' };

      await readabilityHandler(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          fleschReadingEase: expect.any(Number),
          fleschKincaid: expect.any(Number),
          smog: expect.any(Number),
          textLength: expect.any(Number),
        }),
      });
    });

    it('should return 400 for missing text', async () => {
      req.body = {};

      await readabilityHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string',
        code: 'INVALID_INPUT',
      });
    });

    it('should return 400 for non-string text', async () => {
      req.body = { text: [] };

      await readabilityHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('performance tests', () => {
    it('should calculate scores for medium text in reasonable time', async () => {
      const mediumText = 'This is a test sentence. '.repeat(100);

      const start = performance.now();
      const result = await calculateReadabilityScores(mediumText);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // Should complete in under 500ms
      expect(result.textLength).toBe(mediumText.length);
    });

    it('should handle large text efficiently', async () => {
      const largeText =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(200);

      const start = performance.now();
      const result = await calculateReadabilityScores(largeText);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single character text', async () => {
      const result = await calculateReadabilityScores('a');

      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.textLength).toBe(1);
    });

    it('should handle whitespace-only text', async () => {
      const result = await calculateReadabilityScores('   \n\t   ');

      expect(result.fleschReadingEase).toBe(0);
      expect(result.fleschKincaid).toBe(0);
      expect(result.smog).toBe(0);
    });

    it('should handle text with only punctuation', async () => {
      const result = await calculateReadabilityScores('!@#$%^&*().,;:');

      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.fleschKincaid).toBeGreaterThanOrEqual(0);
    });
  });
});
