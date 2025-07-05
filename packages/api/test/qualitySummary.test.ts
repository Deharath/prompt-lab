/**
 * Comprehensive tests for quality summary endpoint
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import { Request, Response } from 'express';
import {
  getQualitySummary,
  qualitySummaryHandler,
  type QualitySummaryQuery,
} from '../src/routes/quality-summary.js';
import { initDb } from '../src/db/index.js';

describe('Quality Summary Service', () => {
  beforeAll(async () => {
    await initDb();
  });

  afterAll(async () => {
    // Close the database connection
  });
  describe('getQualitySummary', () => {
    it('should return summary with default parameters', async () => {
      const query: QualitySummaryQuery = {};
      const result = await getQualitySummary(query);

      expect(result).toMatchObject({
        model: 'all',
        period: {
          start: expect.any(String),
          end: expect.any(String),
          days: expect.any(Number),
        },
        metrics: {
          totalJobs: expect.any(Number),
          avgScore: expect.any(Number),
          avgReadability: expect.any(Number),
          avgSentiment: expect.any(Number),
          successRate: expect.any(Number),
        },
        timestamp: expect.any(String),
      });
    });

    it('should filter by model when specified', async () => {
      const query: QualitySummaryQuery = { model: 'gpt-4' };
      const result = await getQualitySummary(query);

      expect(result.model).toBe('gpt-4');
    });

    it('should respect custom date range', async () => {
      const since = '2024-01-01T00:00:00.000Z';
      const until = '2024-01-02T00:00:00.000Z';
      const query: QualitySummaryQuery = { since, until };

      const result = await getQualitySummary(query);

      expect(result.period.start).toBe(since);
      expect(result.period.end).toBe(until);
    });

    it('should use custom window days', async () => {
      const query: QualitySummaryQuery = { windowDays: 14 };
      const result = await getQualitySummary(query);

      expect(result.period.days).toBe(14);
    });

    it('should include p95 latency when WITH_P95 is enabled', async () => {
      const originalP95 = process.env.WITH_P95;
      process.env.WITH_P95 = 'true';

      try {
        const query: QualitySummaryQuery = {};
        const result = await getQualitySummary(query);

        expect(result.metrics).toHaveProperty('p95_latency_ms');
      } finally {
        process.env.WITH_P95 = originalP95;
      }
    });
  });

  describe('qualitySummaryHandler', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
      req = { query: {} };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
    });

    it('should return quality summary for valid request', async () => {
      req.query = {};

      await qualitySummaryHandler(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          model: expect.any(String),
          period: expect.any(Object),
          metrics: expect.any(Object),
          timestamp: expect.any(String),
        }),
        cached: expect.any(Boolean),
      });
    });

    it('should validate date parameters', async () => {
      req.query = { since: 'invalid-date' };

      await qualitySummaryHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid since date format',
        code: 400,
      });
    });

    it('should validate until date parameter', async () => {
      req.query = { until: 'invalid-date' };

      await qualitySummaryHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid until date format',
        code: 400,
      });
    });

    it('should validate windowDays parameter', async () => {
      req.query = { windowDays: '-5' };

      await qualitySummaryHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'windowDays must be a positive number',
        code: 400,
      });
    });

    it('should handle internal errors gracefully', async () => {
      // Force an error by providing invalid query structure
      req.query = null as any;

      await qualitySummaryHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error while generating quality summary',
        code: 500,
      });
    });
  });

  describe('performance and caching', () => {
    it('should complete summary calculation in reasonable time', async () => {
      const start = performance.now();
      await getQualitySummary({});
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should generate consistent cache keys', async () => {
      const query1: QualitySummaryQuery = { model: 'gpt-4', windowDays: 7 };
      const query2: QualitySummaryQuery = { model: 'gpt-4', windowDays: 7 };

      const result1 = await getQualitySummary(query1);
      const result2 = await getQualitySummary(query2);

      // Results should be structurally identical (cache hit)
      expect(result1.model).toBe(result2.model);
      expect(result1.period.days).toBe(result2.period.days);
    });
  });

  describe('metric aggregation', () => {
    it('should calculate averages correctly', async () => {
      const result = await getQualitySummary({});

      expect(result.metrics.avgScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.avgReadability).toBeGreaterThanOrEqual(0);
      expect(result.metrics.avgSentiment).toBeGreaterThanOrEqual(-1);
      expect(result.metrics.avgSentiment).toBeLessThanOrEqual(1);
      expect(result.metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(result.metrics.successRate).toBeLessThanOrEqual(1);
    });

    it('should handle empty result set gracefully', async () => {
      // Query for a future date range with no data
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const query: QualitySummaryQuery = {
        since: futureDate.toISOString(),
        until: futureDate.toISOString(),
      };

      const result = await getQualitySummary(query);

      expect(result.metrics.totalJobs).toBe(0);
      expect(result.metrics.avgScore).toBe(0);
      expect(result.metrics.successRate).toBe(0);
    });
  });

  describe('SQL aggregation', () => {
    it('should use appropriate date filters', async () => {
      const since = '2024-01-01T00:00:00.000Z';
      const until = '2024-01-31T23:59:59.999Z';

      const query: QualitySummaryQuery = { since, until };
      const result = await getQualitySummary(query);

      expect(result.period.start).toBe(since);
      expect(result.period.end).toBe(until);
    });

    it('should group by model when no specific model requested', async () => {
      const result = await getQualitySummary({});

      // Should aggregate across all models
      expect(result.model).toBe('all');
    });
  });
});
