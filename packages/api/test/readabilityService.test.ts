/**
 * Comprehensive tests for readability service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import {
  calculateReadabilityScores,
  validateTextSize,
  readabilityHandler,
} from '../src/lib/readabilityService.js';

describe('Readability Service', () => {
  describe('calculateReadabilityScores', () => {
    it('should return zero scores for empty text', () => {
      const result = calculateReadabilityScores('');
      expect(result).toEqual({
        fleschReadingEase: 0,
        fleschKincaid: 0,
        smog: 0,
        textLength: 0,
      });
    });

    it('should calculate readability scores for simple text', () => {
      const text = 'This is a simple test. It has short sentences.';
      const result = calculateReadabilityScores(text);

      expect(result.textLength).toBe(text.length);
      expect(result.fleschReadingEase).toBeGreaterThan(0);
      expect(result.fleschKincaid).toBeGreaterThanOrEqual(0);
      expect(result.smog).toBeGreaterThanOrEqual(0);
    });

    it('should handle complex text with appropriate scores', () => {
      const complexText =
        'The implementation of sophisticated algorithms requires comprehensive understanding of computational complexity theory and advanced mathematical foundations.';
      const result = calculateReadabilityScores(complexText);

      expect(result.fleschReadingEase).toBeLessThan(60); // Should be harder to read
      expect(result.fleschKincaid).toBeGreaterThan(10); // Higher grade level
      expect(result.smog).toBeGreaterThan(10); // Higher SMOG grade
    });

    it('should enforce score boundaries', () => {
      const result = calculateReadabilityScores('Test.');

      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.fleschReadingEase).toBeLessThanOrEqual(100);
      expect(result.fleschKincaid).toBeGreaterThanOrEqual(0);
      expect(result.smog).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateTextSize middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      next = vi.fn();
    });

    it('should allow text under 20kB', () => {
      req.body = { text: 'Short text' };
      validateTextSize(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject text over 20kB with 413', () => {
      const largeText = 'x'.repeat(21 * 1024); // 21kB
      req.body = { text: largeText };

      validateTextSize(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Text too large'),
          code: 413,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing text gracefully', () => {
      req.body = {};
      validateTextSize(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
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
      req.body = { text: 'This is a test sentence.' };

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
        code: 400,
      });
    });

    it('should return 400 for non-string text', async () => {
      req.body = { text: 123 };

      await readabilityHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('performance tests', () => {
    it('should calculate scores for large text in reasonable time', () => {
      const largeText = 'This is a sentence. '.repeat(1000); // ~20kB

      const start = performance.now();
      const result = calculateReadabilityScores(largeText);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(result.textLength).toBe(largeText.length);
    });
  });
});
