/**
 * Tests for sentimentService - properly isolated unit tests
 * No external dependencies, properly mocked, environment-agnostic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fetch from 'node-fetch';
import {
  analyzeSentiment,
  sentimentHandler,
  validateSentimentRequest,
  type SentimentScore,
} from '../src/lib/sentimentService';
import { log } from '../src/utils/logger';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  __esModule: true, // handle esm
  default: vi.fn(),
}));

// Mock logger to suppress output during tests
vi.mock('../src/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedFetch = fetch as vi.Mock;

describe('SentimentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeSentiment', () => {
    it('should return a detailed sentiment score on success', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          compound: 0.9,
          positive: 0.9,
          negative: 0,
          neutral: 0.1,
          label: 'positive',
          confidence: 0.9,
          mode: 'accurate',
        },
      };
      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = (await analyzeSentiment(
        'This is a wonderful test!',
        true,
      )) as SentimentScore;

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/sentiment',
        expect.any(Object),
      );
      expect(result.label).toBe('positive');
      expect(result.compound).toBe(0.9);
      expect(result.disabled).toBeUndefined();
    });

    it('should return just the compound score when detailed is false', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          compound: 0.9,
          positive: 0.9,
          negative: 0,
          neutral: 0.1,
          label: 'positive',
          confidence: 0.9,
          mode: 'accurate',
        },
      };
      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await analyzeSentiment('This is a wonderful test!', false);
      expect(result).toBe(0.9);
    });

    it('should return a neutral fallback score when API call fails', async () => {
      mockedFetch.mockRejectedValue(new Error('API is down'));

      const result = (await analyzeSentiment(
        'This will fail',
        true,
      )) as SentimentScore;

      expect(result.label).toBe('neutral');
      expect(result.disabled).toBe(true);
      expect(result.disabledReason).toBe('API unavailable, using fallback');
      expect(log.warn).toHaveBeenCalled();
    });

    it('should return a neutral score for empty text without calling API', async () => {
      const result = (await analyzeSentiment('', true)) as SentimentScore;
      expect(result.label).toBe('neutral');
      expect(result.confidence).toBe(1);
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('should return a disabled score when forceDisable is true', async () => {
      const result = (await analyzeSentiment(
        'some text',
        true,
        true,
      )) as SentimentScore;
      expect(result.disabled).toBe(true);
      expect(result.disabledReason).toContain('memory constraints');
      expect(mockedFetch).not.toHaveBeenCalled();
    });
  });

  describe('sentimentHandler', () => {
    it('should return sentiment for valid text', async () => {
      const mockApiResponse = {
        success: true,
        data: { label: 'positive', compound: 0.8 },
      };
      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const req = { body: { text: 'This is a test' } };
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      await sentimentHandler(req as any, res as any);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing text', async () => {
      const req = { body: {} };
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      await sentimentHandler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Text field is required and must be a string',
        }),
      );
    });
  });

  describe('validateSentimentRequest', () => {
    it('should call next for valid request', () => {
      const req = { body: { text: 'Valid text' } };
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      const next = vi.fn();
      validateSentimentRequest(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 for missing text', () => {
      const req = { body: {} };
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      const next = vi.fn();
      validateSentimentRequest(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required field: text',
        }),
      );
    });

    it('should return 413 for text that is too long', () => {
      const req = { body: { text: 'a'.repeat(10001) } };
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      const next = vi.fn();
      validateSentimentRequest(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Text too long. Maximum length is 10,000 characters',
        }),
      );
    });
  });
});
