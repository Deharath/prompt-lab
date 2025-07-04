/**
 * Comprehensive tests for sentiment service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import {
  analyzeSentiment,
  sentimentHandler,
  validateSentimentRequest,
} from '../src/lib/sentimentService.js';

describe('Sentiment Service', () => {
  describe('analyzeSentiment', () => {
    it('should return neutral sentiment for empty text', async () => {
      const result = await analyzeSentiment('');
      expect(result).toEqual({
        compound: 0,
        positive: 0,
        negative: 0,
        neutral: 1,
        mode: expect.any(String),
      });
    });

    it('should detect positive sentiment', async () => {
      const result = await analyzeSentiment(
        'I love this amazing product! It is fantastic and wonderful!',
      );
      expect(result.compound).toBeGreaterThan(0);
      expect(result.positive).toBeGreaterThan(0);
      expect(result.mode).toMatch(/fast|accurate/);
    });

    it('should detect negative sentiment', async () => {
      const result = await analyzeSentiment(
        'I hate this terrible product! It is awful and disgusting!',
      );
      expect(result.compound).toBeLessThan(0);
      expect(result.negative).toBeGreaterThan(0);
      expect(result.mode).toMatch(/fast|accurate/);
    });

    it('should handle neutral text', async () => {
      const result = await analyzeSentiment(
        'This is a neutral statement about the weather.',
      );
      expect(result.compound).toBeGreaterThanOrEqual(-0.5);
      expect(result.compound).toBeLessThanOrEqual(0.5);
      expect(result.neutral).toBeGreaterThan(0);
    });

    it('should maintain score boundaries', async () => {
      const result = await analyzeSentiment('Test text');
      expect(result.compound).toBeGreaterThanOrEqual(-1);
      expect(result.compound).toBeLessThanOrEqual(1);
      expect(result.positive).toBeGreaterThanOrEqual(0);
      expect(result.positive).toBeLessThanOrEqual(1);
      expect(result.negative).toBeGreaterThanOrEqual(0);
      expect(result.negative).toBeLessThanOrEqual(1);
      expect(result.neutral).toBeGreaterThanOrEqual(0);
      expect(result.neutral).toBeLessThanOrEqual(1);
    });
  });

  describe('validateSentimentRequest middleware', () => {
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

    it('should allow valid text', () => {
      req.body = { text: 'Valid text input' };
      validateSentimentRequest(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing text', () => {
      req.body = {};
      validateSentimentRequest(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required field: text',
        code: 400,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-string text', () => {
      req.body = { text: 123 };
      validateSentimentRequest(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Text field must be a string',
        code: 400,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject text over 10,000 characters', () => {
      const longText = 'x'.repeat(10001);
      req.body = { text: longText };

      validateSentimentRequest(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Text too long. Maximum length is 10,000 characters',
        code: 413,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('sentimentHandler', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
    });

    it('should return sentiment analysis for valid text', async () => {
      req.body = { text: 'This is a test sentence.' };

      await sentimentHandler(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          compound: expect.any(Number),
          positive: expect.any(Number),
          negative: expect.any(Number),
          neutral: expect.any(Number),
          mode: expect.stringMatching(/fast|accurate/),
        }),
      });
    });

    it('should return 400 for missing text', async () => {
      req.body = {};

      await sentimentHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string',
        code: 400,
      });
    });

    it('should return 400 for non-string text', async () => {
      req.body = { text: [] };

      await sentimentHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('mode switching', () => {
    const originalMode = process.env.SENTIMENT_MODE;

    afterEach(() => {
      process.env.SENTIMENT_MODE = originalMode;
    });

    it('should use fast mode by default', async () => {
      delete process.env.SENTIMENT_MODE;
      const result = await analyzeSentiment('Test text');
      expect(result.mode).toBe('fast');
    });

    it('should respect SENTIMENT_MODE environment variable', async () => {
      process.env.SENTIMENT_MODE = 'accurate';
      const result = await analyzeSentiment('Test text');
      expect(result.mode).toBe('accurate');
    });
  });

  describe('performance tests', () => {
    it('should analyze sentiment in reasonable time', async () => {
      const text = 'This is a good test. '.repeat(100); // Medium text

      const start = performance.now();
      const result = await analyzeSentiment(text);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle text with special characters', async () => {
      const result = await analyzeSentiment(
        '🎉 Great! 👍 @username #hashtag https://example.com',
      );
      expect(result).toBeDefined();
      expect(result.compound).toBeGreaterThanOrEqual(-1);
      expect(result.compound).toBeLessThanOrEqual(1);
    });

    it('should handle multilingual text gracefully', async () => {
      const result = await analyzeSentiment(
        'Hello world. Bonjour monde. Hola mundo.',
      );
      expect(result).toBeDefined();
      expect(result.mode).toMatch(/fast|accurate/);
    });

    it('should handle very short text', async () => {
      const result = await analyzeSentiment('OK');
      expect(result).toBeDefined();
      expect(typeof result.compound).toBe('number');
    });
  });
});
