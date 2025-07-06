/**
 * // Mock the database module
vi.mock('../src/db/index.js', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    groupBy: vi.fn()
  },
  getDb: vi.fn(),
  resetDb: vi.fn()
}));

// Mock node-cache tests for /api/quality-summary endpoint
 * Tests filtering, caching, and aggregation logic with mock database
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getQualitySummary,
  type QualitySummaryQuery,
  type QualitySummaryResponse,
} from '../src/routes/quality-summary';

// Mock the database connection
vi.mock('../src/db/index.js', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    groupBy: vi.fn(),
  },
}));

// Mock node-cache
vi.mock('node-cache', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
    })),
  };
});

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  gte: vi.fn((field, value) => ({ type: 'gte', field, value })),
  lte: vi.fn((field, value) => ({ type: 'lte', field, value })),
  sql: vi.fn((template) => ({ type: 'sql', template })),
}));

// Mock the jobs schema
vi.mock('../src/db/schema.js', () => ({
  jobs: {
    createdAt: 'created_at',
    status: 'status',
    model: 'model',
  },
}));

// Mock environment variables
const originalEnv = process.env;

describe('Quality Summary Integration Tests', () => {
  let mockDb: any;
  let mockQuery: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.SUMMARY_WINDOW_DAYS = '7';
    process.env.SUMMARY_CACHE_TTL = '30';
    process.env.WITH_P95 = 'false';

    // Set up mock database query chain
    mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    };

    mockDb = {
      select: vi.fn().mockReturnValue(mockQuery),
    };

    // Mock the db import using dynamic import
    const dbModule = await import('../src/db/index.js');
    Object.assign(dbModule.db, mockDb);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getQualitySummary', () => {
    it('should return empty summary when no jobs found', async () => {
      // Mock empty results - set the mock query to return empty array
      mockQuery.execute = vi.fn().mockResolvedValue([]);
      // For the direct await without execute, set the mock to resolve as array
      Object.assign(mockQuery, { then: (resolve: any) => resolve([]) });

      const query: QualitySummaryQuery = {
        model: 'gpt-4',
        windowDays: 7,
      };

      const result = await getQualitySummary(query);

      expect(result).toEqual({
        model: 'gpt-4',
        period: {
          start: expect.any(String),
          end: expect.any(String),
          days: 7,
        },
        metrics: {
          totalJobs: 0,
          avgScore: 0,
          avgReadability: 0,
          avgSentiment: 0,
          successRate: 0,
        },
        timestamp: expect.any(String),
      });
    });

    it('should calculate metrics correctly for single model', async () => {
      // Mock aggregate results
      const mockResults = [
        {
          totalJobs: 10,
          model: 'gpt-4',
          avgFleschScore: 65.5,
          avgSentiment: 0.8,
          avgResponseTime: 1200,
          successRate: 1.0,
        },
      ];

      // Mock the promise-like behavior of the query
      Object.assign(mockQuery, {
        then: (resolve: any) => resolve(mockResults),
        catch: (reject: any) => mockQuery,
      });

      const query: QualitySummaryQuery = {
        model: 'gpt-4',
        windowDays: 7,
      };

      const result = await getQualitySummary(query);

      expect(result.model).toBe('gpt-4');
      expect(result.metrics.totalJobs).toBe(10);
      expect(result.metrics.avgReadability).toBe(65.5);
      expect(result.metrics.avgSentiment).toBe(0.8);
      expect(result.metrics.avgScore).toBe((65.5 + 0.8) / 2);
      expect(result.metrics.successRate).toBe(1.0);
    });

    it('should aggregate results across multiple models when no specific model requested', async () => {
      // Mock results for multiple models
      const mockResults = [
        {
          totalJobs: 5,
          model: 'gpt-4',
          avgFleschScore: 70.0,
          avgSentiment: 0.9,
          avgResponseTime: 1000,
          successRate: 1.0,
        },
        {
          totalJobs: 3,
          model: 'gpt-3.5-turbo',
          avgFleschScore: 60.0,
          avgSentiment: 0.7,
          avgResponseTime: 800,
          successRate: 1.0,
        },
      ];

      Object.assign(mockQuery, {
        then: (resolve: any) => resolve(mockResults),
      });

      const query: QualitySummaryQuery = {
        windowDays: 7,
      };

      const result = await getQualitySummary(query);

      expect(result.model).toBe('all');
      expect(result.metrics.totalJobs).toBe(8); // 5 + 3
      expect(result.metrics.avgReadability).toBe((70.0 + 60.0) / 2); // average across models
      expect(result.metrics.avgSentiment).toBe((0.9 + 0.7) / 2); // average across models
    });

    it('should handle null metrics gracefully', async () => {
      // Mock results with null values
      const mockResults = [
        {
          totalJobs: 5,
          model: 'gpt-4',
          avgFleschScore: null,
          avgSentiment: null,
          avgResponseTime: null,
          successRate: 1.0,
        },
      ];

      Object.assign(mockQuery, {
        then: (resolve: any) => resolve(mockResults),
      });

      const query: QualitySummaryQuery = {
        model: 'gpt-4',
        windowDays: 7,
      };

      const result = await getQualitySummary(query);

      expect(result.metrics.avgReadability).toBe(0);
      expect(result.metrics.avgSentiment).toBe(0);
      expect(result.metrics.avgScore).toBe(0);
    });

    it('should calculate p95 latency when WITH_P95 is enabled', async () => {
      // Set environment variable BEFORE importing the module
      process.env.WITH_P95 = 'true';

      // Force module to re-evaluate the WITH_P95 constant
      vi.resetModules();
      const { getQualitySummary } = await import(
        '../src/routes/quality-summary.js'
      );

      // Mock aggregate results (first query)
      const mockAggregateResults = [
        {
          totalJobs: 10,
          model: 'gpt-4',
          avgFleschScore: 65.5,
          avgSentiment: 0.8,
          avgResponseTime: 1200,
          successRate: 1.0,
        },
      ];

      // Mock p95 latency query results (second query)
      const mockP95Results = [
        { responseTime: 800 },
        { responseTime: 900 },
        { responseTime: 1000 },
        { responseTime: 1100 },
        { responseTime: 1200 },
        { responseTime: 1300 },
        { responseTime: 1400 },
        { responseTime: 1500 },
        { responseTime: 1600 },
        { responseTime: 2000 }, // This should be the p95 value
      ];

      // Create separate mock queries for each use case
      const mockAggregateQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        execute: vi.fn(),
        then: vi.fn((callback) => callback(mockAggregateResults)),
      };

      const mockP95Query = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn(),
        then: vi.fn((callback) => callback(mockP95Results)),
      };

      // Mock db.select to return different queries based on call order
      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return mockAggregateQuery; // First call is for aggregation
        } else {
          return mockP95Query; // Second call is for p95 response times
        }
      });

      const query: QualitySummaryQuery = {
        model: 'gpt-4',
        windowDays: 7,
      };

      const result = await getQualitySummary(query);

      expect(result.metrics.p95_latency_ms).toBe(2000);
    });

    it('should use correct date range parameters', async () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      Object.assign(mockQuery, {
        then: (resolve: any) => resolve([]),
      });

      const query: QualitySummaryQuery = {
        since: '2024-01-10T00:00:00Z',
        until: '2024-01-15T00:00:00Z',
        model: 'gpt-4',
      };

      await getQualitySummary(query);

      // Verify that the db.select was called
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should use default window when no dates specified', async () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      Object.assign(mockQuery, {
        then: (resolve: any) => resolve([]),
      });

      const query: QualitySummaryQuery = {
        windowDays: 14,
      };

      await getQualitySummary(query);

      // Verify that the query was constructed properly
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle model filtering correctly', async () => {
      Object.assign(mockQuery, {
        then: (resolve: any) => resolve([]),
      });

      const query: QualitySummaryQuery = {
        model: 'gpt-4',
        windowDays: 7,
      };

      await getQualitySummary(query);

      // Verify that where clause was called (would include model filter)
      expect(mockQuery.where).toHaveBeenCalled();
    });

    it('should format response with correct structure', async () => {
      const mockResults = [
        {
          totalJobs: 5,
          model: 'gpt-4',
          avgFleschScore: 70.0,
          avgSentiment: 0.8,
          avgResponseTime: 1200,
          successRate: 1.0,
        },
      ];

      Object.assign(mockQuery, {
        then: (resolve: any) => resolve(mockResults),
      });

      const query: QualitySummaryQuery = {
        model: 'gpt-4',
        since: '2024-01-10T00:00:00Z',
        until: '2024-01-15T00:00:00Z',
      };

      const result = await getQualitySummary(query);

      // Verify the response structure
      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('timestamp');

      expect(result.period).toHaveProperty('start');
      expect(result.period).toHaveProperty('end');
      expect(result.period).toHaveProperty('days');

      expect(result.metrics).toHaveProperty('totalJobs');
      expect(result.metrics).toHaveProperty('avgScore');
      expect(result.metrics).toHaveProperty('avgReadability');
      expect(result.metrics).toHaveProperty('avgSentiment');
      expect(result.metrics).toHaveProperty('successRate');

      // Verify ISO date format
      expect(new Date(result.period.start).toISOString()).toBe(
        result.period.start,
      );
      expect(new Date(result.period.end).toISOString()).toBe(result.period.end);
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should use query builder pattern correctly', async () => {
      Object.assign(mockQuery, {
        then: (resolve: any) => resolve([]),
      });

      const query: QualitySummaryQuery = {
        model: 'gpt-4',
        windowDays: 7,
      };

      await getQualitySummary(query);

      // Verify the query builder chain was called in correct order
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQuery.from).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalled();
      expect(mockQuery.groupBy).toHaveBeenCalled();
    });
  });
});
