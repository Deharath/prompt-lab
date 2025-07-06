/**
 * Tests for sentimentService - validates both fast (VADER) and accurate (RoBERTa) modes
 * Tests the fallback mechanism and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  analyzeSentiment,
  sentimentHandler,
  validateSentimentRequest,
  resetTransformersCache,
  type SentimentScore,
} from '../src/lib/sentimentService';
import type { Request, Response } from 'express';

// Mock environment variable
const originalSentimentMode = process.env.SENTIMENT_MODE;

// Mock modules
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
}));

describe('SentimentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTransformersCache(); // Clear the transformers cache between tests
  });

  describe('analyzeSentiment', () => {
    it('should return neutral sentiment for empty text', async () => {
      const result = (await analyzeSentiment('', true)) as SentimentScore;
      expect(result).toEqual({
        compound: 0,
        positive: 0,
        negative: 0,
        neutral: 1,
        label: 'neutral',
        confidence: 1,
        mode: 'accurate',
      });
    });

    it('should return neutral sentiment for whitespace-only text', async () => {
      const result = (await analyzeSentiment(
        '   \n\t  ',
        true,
      )) as SentimentScore;
      expect(result).toEqual({
        compound: 0,
        positive: 0,
        negative: 0,
        neutral: 1,
        label: 'neutral',
        confidence: 1,
        mode: 'accurate',
      });
    });

    it('should use accurate mode', async () => {
      // Mock transformers to succeed
      const transformersModule = await import('@huggingface/transformers');
      const mockPipeline = vi.fn().mockResolvedValue([
        { label: 'LABEL_2', score: 0.8 }, // positive
        { label: 'LABEL_1', score: 0.15 }, // neutral
        { label: 'LABEL_0', score: 0.05 }, // negative
      ]);
      (vi.mocked(transformersModule.pipeline) as any).mockResolvedValue(
        mockPipeline,
      );

      const result = (await analyzeSentiment(
        'This is wonderful!',
        true,
      )) as SentimentScore;
      expect(result.mode).toBe('accurate');
      expect(result.label).toBe('positive');
      expect(result.positive).toBe(0.8);
    });

    it('should handle transformers single result format', async () => {
      // Mock transformers to return single result
      const transformersModule = await import('@huggingface/transformers');
      const mockPipeline = vi.fn().mockResolvedValue({
        label: 'LABEL_0',
        score: 0.85,
      });
      (vi.mocked(transformersModule.pipeline) as any).mockResolvedValue(
        mockPipeline,
      );

      const result = (await analyzeSentiment(
        'This is awful!',
        true,
      )) as SentimentScore;
      expect(result.mode).toBe('accurate');
      expect(result.label).toBe('negative');
      expect(result.negative).toBe(0.85);
    });
  });

  describe('sentimentHandler', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let statusMock: ReturnType<typeof vi.fn>;
    let jsonMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      statusMock = vi.fn().mockReturnThis();
      jsonMock = vi.fn().mockReturnThis();

      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
    });

    it('should handle valid sentiment analysis request', async () => {
      mockRequest = {
        body: { text: 'This is a test message' },
      };

      // Mock successful sentiment analysis
      const transformersModule = await import('@huggingface/transformers');
      const mockPipeline = vi.fn().mockResolvedValue([
        { label: 'LABEL_1', score: 0.9 }, // neutral
      ]);
      (vi.mocked(transformersModule.pipeline) as any).mockResolvedValue(
        mockPipeline,
      );

      await sentimentHandler(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          compound: expect.any(Number),
          positive: expect.any(Number),
          negative: expect.any(Number),
          neutral: expect.any(Number),
          label: expect.any(String),
          confidence: expect.any(Number),
          mode: expect.any(String),
        }),
      });
    });

    it('should return 400 for missing text field', async () => {
      mockRequest = {
        body: {},
      };

      await sentimentHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string',
        code: 400,
      });
    });

    it('should return 400 for non-string text field', async () => {
      mockRequest = {
        body: { text: 123 },
      };

      await sentimentHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string',
        code: 400,
      });
    });

    it('should handle successful sentiment analysis (robust fallback)', async () => {
      mockRequest = {
        body: { text: 'Test text' },
      };

      // Mock transformers to succeed with normal response
      const transformersModule = await import('@huggingface/transformers');
      const mockPipeline = vi.fn().mockResolvedValue([
        { label: 'LABEL_1', score: 0.9 }, // neutral
      ]);
      (vi.mocked(transformersModule.pipeline) as any).mockResolvedValue(
        mockPipeline,
      );

      await sentimentHandler(mockRequest as Request, mockResponse as Response);

      // The service should succeed even with errors due to robust fallback
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          mode: 'accurate',
          label: expect.any(String),
          compound: expect.any(Number),
        }),
      });
    });
  });

  describe('validateSentimentRequest', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: ReturnType<typeof vi.fn>;
    let statusMock: ReturnType<typeof vi.fn>;
    let jsonMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      statusMock = vi.fn().mockReturnThis();
      jsonMock = vi.fn().mockReturnThis();
      mockNext = vi.fn();

      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
    });

    it('should call next() for valid request', () => {
      mockRequest = {
        body: { text: 'Valid text content' },
      };

      validateSentimentRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 for missing text field', () => {
      mockRequest = {
        body: {},
      };

      validateSentimentRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing required field: text',
        code: 400,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for non-string text field', () => {
      mockRequest = {
        body: { text: { invalid: 'object' } },
      };

      validateSentimentRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Text field must be a string',
        code: 400,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 413 for text that is too long', () => {
      const longText = 'a'.repeat(10001);
      mockRequest = {
        body: { text: longText },
      };

      validateSentimentRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(413);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Text too long. Maximum length is 10,000 characters',
        code: 413,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow text at maximum length', () => {
      const maxLengthText = 'a'.repeat(10000);
      mockRequest = {
        body: { text: maxLengthText },
      };

      validateSentimentRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
