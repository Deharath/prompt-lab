/**
 * Integration tests for quality-summary endpoint
 * Task 9 - Testing & CI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { sql } from 'drizzle-orm';

describe('Quality Summary Integration Tests', () => {
  let getDb: any;
  let resetDb: any;
  let jobs: any;

  beforeEach(async () => {
    // Reset modules and set up clean test environment
    vi.resetModules();

    process.env.DATABASE_URL = ':memory:';
    process.env.NODE_ENV = 'test';

    // Import and initialize database
    const api = await import('@prompt-lab/api');
    getDb = api.getDb;
    resetDb = api.resetDb;
    jobs = api.jobs;

    // Reset and initialize database properly
    if (typeof resetDb === 'function') {
      resetDb();
    }
    if (typeof getDb === 'function') {
      await getDb(); // This will run migrations and create tables
    }

    // Clear any existing test data using raw SQL
    const dbInstance = await getDb();
    await dbInstance.execute(sql`DELETE FROM jobs WHERE model LIKE 'test-%'`);
  });

  afterEach(async () => {
    // Clean up test data using raw SQL
    if (typeof getDb === 'function') {
      const dbInstance = await getDb();
      await dbInstance.execute(sql`DELETE FROM jobs WHERE model LIKE 'test-%'`);
    }
  });

  describe('GET /api/quality-summary', () => {
    async function seedJobs(jobList: unknown[]) {
      if (typeof getDb === 'function' && jobs) {
        const db = await getDb();
        await db.insert(jobs).values(jobList);
      }
    }

    it('should return empty summary when no jobs exist', async () => {
      const response = await request(app)
        .get('/api/quality-summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        model: 'all',
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

    it('should return summary with default 7-day window', async () => {
      // Seed test data
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const testJobs = [
        {
          id: 'test-job-1',
          prompt: 'Test prompt 1',
          provider: 'openai',
          model: 'test-gpt4',
          status: 'completed' as const,
          createdAt: now,
          metrics: JSON.stringify({
            flesch_reading_ease: 65.5,
            sentiment: 0.8,
            response_time_ms: 1500,
          }),
          costUsd: 0.01,
        },
        {
          id: 'test-job-2',
          prompt: 'Test prompt 2',
          provider: 'openai',
          model: 'test-gpt4',
          status: 'completed' as const,
          createdAt: oneHourAgo,
          metrics: JSON.stringify({
            flesch_reading_ease: 65.5,
            sentiment: 0.8,
            response_time_ms: 1500,
          }),
          costUsd: 0.01,
        },
      ];

      await seedJobs(testJobs);

      const response = await request(app)
        .get('/api/quality-summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics.totalJobs).toBe(2);
      expect(response.body.data.metrics.avgReadability).toBeCloseTo(65.5, 1);
      expect(response.body.data.metrics.avgSentiment).toBeCloseTo(0.8, 1);
    });

    it('should filter by model when specified', async () => {
      // Seed test data for multiple models
      const now = new Date();

      const testJobs = [
        {
          id: 'test-job-3',
          prompt: 'Test prompt 3',
          provider: 'openai',
          model: 'test-gpt4',
          status: 'completed' as const,
          createdAt: now,
          metrics: JSON.stringify({
            flesch_reading_ease: 70.0,
            sentiment: 0.5,
            response_time_ms: 1000,
          }),
          costUsd: 0.01,
        },
        {
          id: 'test-job-4',
          prompt: 'Test prompt 4',
          provider: 'anthropic',
          model: 'test-claude',
          status: 'completed' as const,
          createdAt: now,
          metrics: JSON.stringify({
            flesch_reading_ease: 60.0,
            sentiment: -0.2,
            response_time_ms: 2000,
          }),
          costUsd: 0.02,
        },
      ];

      await seedJobs(testJobs);

      const response = await request(app)
        .get('/api/quality-summary?model=test-gpt4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.model).toBe('test-gpt4');
      expect(response.body.data.metrics.totalJobs).toBe(1);
      expect(response.body.data.metrics.avgReadability).toBeCloseTo(70.0, 1);
    });

    it('should respect custom date range', async () => {
      // Insert test data with different timestamps
      const dbInstance = await getDb();
      const insertSql = `
        INSERT INTO jobs (model, status, metrics, created_at)
        VALUES (?, 'completed', ?, ?)
      `;
      const stmt = dbInstance.prepare(insertSql);

      const now = Math.floor(Date.now() / 1000);
      const yesterday = now - 24 * 60 * 60;
      const weekAgo = now - 7 * 24 * 60 * 60;

      const metrics = JSON.stringify({
        flesch_reading_ease: 65.0,
        sentiment: 0.3,
        response_time_ms: 1200,
      });

      stmt.run('test-model', metrics, now);
      stmt.run('test-model', metrics, yesterday);
      stmt.run('test-model', metrics, weekAgo);

      const since = new Date(yesterday * 1000).toISOString();
      const until = new Date(now * 1000).toISOString();

      const response = await request(app)
        .get(`/api/quality-summary?since=${since}&until=${until}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics.totalJobs).toBe(2); // Only jobs within range
    });

    it('should include p95 latency when WITH_P95 flag is enabled', async () => {
      // Set environment variable
      const originalFlag = process.env.WITH_P95;
      process.env.WITH_P95 = 'true';

      try {
        // Insert test data with various response times
        const dbInstance = await getDb();
        const insertSql = `
          INSERT INTO jobs (model, status, metrics, created_at)
          VALUES (?, 'completed', ?, ?)
        `;
        const stmt = dbInstance.prepare(insertSql);

        const now = Math.floor(Date.now() / 1000);

        // Insert jobs with different response times
        const responseTimes = [
          100, 200, 300, 500, 800, 1000, 1500, 2000, 3000, 5000,
        ];
        responseTimes.forEach((time, index) => {
          const metrics = JSON.stringify({
            flesch_reading_ease: 60.0,
            sentiment: 0.0,
            response_time_ms: time,
          });
          stmt.run('test-model', metrics, now - index);
        });

        const response = await request(app)
          .get('/api/quality-summary')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.metrics).toHaveProperty('p95_latency_ms');
        expect(response.body.data.metrics.p95_latency_ms).toBeGreaterThan(0);
      } finally {
        // Restore original flag
        if (originalFlag) {
          process.env.WITH_P95 = originalFlag;
        } else {
          delete process.env.WITH_P95;
        }
      }
    });

    it('should validate date parameters', async () => {
      const response = await request(app)
        .get('/api/quality-summary?since=invalid-date')
        .expect(400);

      expect(response.body.error).toContain('Invalid since date format');
    });

    it('should validate windowDays parameter', async () => {
      const response = await request(app)
        .get('/api/quality-summary?windowDays=-1')
        .expect(400);

      expect(response.body.error).toContain(
        'windowDays must be a positive number',
      );
    });

    it('should handle database errors gracefully', async () => {
      // Mock database failure
      const originalGetDb = getDb;
      vi.mocked(getDb).mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/quality-summary')
        .expect(500);

      expect(response.body.error).toContain('error');

      // Restore original function
      vi.mocked(getDb).mockImplementation(originalGetDb);
    });

    it('should return cached results on subsequent requests', async () => {
      // Set a longer cache TTL for this test
      const originalTTL = process.env.SUMMARY_CACHE_TTL;
      process.env.SUMMARY_CACHE_TTL = '60'; // 60 seconds

      try {
        // Insert test data
        const dbInstance = await getDb();
        const insertSql = `
          INSERT INTO jobs (model, status, metrics, created_at)
          VALUES (?, 'completed', ?, ?)
        `;
        const stmt = dbInstance.prepare(insertSql);

        const now = Math.floor(Date.now() / 1000);
        const metrics = JSON.stringify({
          flesch_reading_ease: 65.0,
          sentiment: 0.5,
          response_time_ms: 1000,
        });

        stmt.run('test-model', metrics, now);

        // First request - should hit database
        const response1 = await request(app)
          .get('/api/quality-summary')
          .expect(200);

        expect(response1.body.cached).toBe(false);

        // Second request - should hit cache
        const response2 = await request(app)
          .get('/api/quality-summary')
          .expect(200);

        expect(response2.body.cached).toBe(true);
        expect(response2.body.data).toEqual(response1.body.data);
      } finally {
        // Restore original TTL
        if (originalTTL) {
          process.env.SUMMARY_CACHE_TTL = originalTTL;
        } else {
          delete process.env.SUMMARY_CACHE_TTL;
        }
      }
    });

    it('should calculate correct aggregations', async () => {
      // Insert precise test data
      const dbInstance = await getDb();
      const insertSql = `
        INSERT INTO jobs (model, status, metrics, created_at)
        VALUES (?, 'completed', ?, ?)
      `;
      const stmt = dbInstance.prepare(insertSql);

      const now = Math.floor(Date.now() / 1000);

      // Insert 3 jobs with known metrics
      const jobs = [
        { flesch: 60.0, sentiment: 0.5, response: 1000 },
        { flesch: 80.0, sentiment: 0.3, response: 1500 },
        { flesch: 70.0, sentiment: 0.7, response: 2000 },
      ];

      jobs.forEach((job, index) => {
        const metrics = JSON.stringify({
          flesch_reading_ease: job.flesch,
          sentiment: job.sentiment,
          response_time_ms: job.response,
        });
        stmt.run('test-model', metrics, now - index);
      });

      const response = await request(app)
        .get('/api/quality-summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics.totalJobs).toBe(3);
      expect(response.body.data.metrics.avgReadability).toBeCloseTo(70.0, 1); // (60+80+70)/3
      expect(response.body.data.metrics.avgSentiment).toBeCloseTo(0.5, 1); // (0.5+0.3+0.7)/3
      expect(response.body.data.metrics.successRate).toBe(1.0); // All completed
    });
  });
});
