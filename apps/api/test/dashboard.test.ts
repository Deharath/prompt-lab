import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';
import type { Server } from 'http';
import type supertest from 'supertest';

let app: Express;
let getDb: unknown;
let jobs: unknown;
let request: typeof supertest;
let getPort: () => Promise<number>;
let server: Server;

describe('Dashboard API', () => {
  beforeAll(async () => {
    // Clean and migrate DB before importing app/DB code
    const { fileURLToPath, pathToFileURL } = await import('url');
    const { join, dirname, resolve } = await import('path');
    const { existsSync, unlinkSync } = await import('fs');
    const testDir = dirname(fileURLToPath(import.meta.url));
    const monorepoRoot = resolve(testDir, '../../../');
    const dbFile = resolve(monorepoRoot, 'packages/db/db.sqlite');
    const { resetDb } = await import('@prompt-lab/api');
    if (existsSync(dbFile)) {
      unlinkSync(dbFile);
    }
    resetDb();
    const migrationsPath = join(
      testDir,
      '../../../packages/api/src/db/migrations.ts',
    );
    const migrationsUrl = pathToFileURL(migrationsPath).href;
    const { runMigrations } = await import(migrationsUrl);
    await runMigrations();

    // Now import app/DB code
    request = (await import('supertest')).default;
    getPort = (await import('get-port')).default;
    const api = await import('@prompt-lab/api');
    getDb = api.getDb;
    jobs = api.jobs;
    app = (await import('../src/index.ts')).app;
  });

  async function seedJobs(jobList: unknown[]) {
    if (typeof getDb === 'function' && jobs) {
      const db = await getDb();
      await db.insert(jobs).values(jobList);
    }
  }

  it('should aggregate dashboard stats correctly', async () => {
    // ARRANGE: Seed jobs with various dates and metrics
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const testId = Math.random().toString(36).substring(7);

    await seedJobs([
      {
        id: `dashboard-job-2-${testId}`,
        prompt: 'Test prompt 2',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        status: 'completed',
        createdAt: yesterday,
        metrics: JSON.stringify({ scores: { accuracy: 0.9, relevance: 0.92 } }),
        costUsd: 0.75,
      },
      {
        id: `dashboard-job-3-${testId}`,
        prompt: 'Test prompt 3',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: twoDaysAgo,
        metrics: JSON.stringify({
          scores: { accuracy: 0.75, relevance: 0.81 },
        }),
        costUsd: 0.95,
      },
      {
        id: `dashboard-job-4-${testId}`,
        prompt: 'Test prompt 4',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        status: 'completed',
        createdAt: now,
        metrics: JSON.stringify({
          scores: { accuracy: 0.85, relevance: 0.91 },
        }),
        costUsd: 0.45,
      },
    ]);

    // ACT: Make a request to the dashboard stats endpoint
    server = app.listen(await getPort());
    const response = await request(server).get('/api/dashboard/stats?days=30');
    server.close();

    // ASSERT: Verify the response structure and data
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('scoreHistory');
    expect(response.body).toHaveProperty('costByModel');

    // Verify scoreHistory structure
    expect(Array.isArray(response.body.scoreHistory)).toBe(true);
    response.body.scoreHistory.forEach((item: unknown) => {
      expect(item).toHaveProperty('date');
      expect(item).toHaveProperty('avgScore');
      expect(typeof (item as { date: string }).date).toBe('string');
      expect(typeof (item as { avgScore: number }).avgScore).toBe('number');
    });

    // Verify costByModel structure
    expect(Array.isArray(response.body.costByModel)).toBe(true);
    response.body.costByModel.forEach((item: unknown) => {
      expect(item).toHaveProperty('model');
      expect(item).toHaveProperty('totalCost');
      expect(typeof (item as { model: string }).model).toBe('string');
      expect(typeof (item as { totalCost: number }).totalCost).toBe('number');
    });
  });

  it('should return 400 for invalid days parameter', async () => {
    // ACT: Make a request with invalid days parameter
    server = app.listen(await getPort());
    const response = await request(server).get(
      '/api/dashboard/stats?days=notanumber',
    );
    server.close();
    expect(response.status).toBe(400);
  });

  it('should return 400 for zero days parameter', async () => {
    // ACT: Make a request with zero days parameter
    server = app.listen(await getPort());
    const response = await request(server).get('/api/dashboard/stats?days=0');
    server.close();

    // ASSERT: Verify error response
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe(
      "Invalid 'days' parameter. Must be a positive integer.",
    );
  });

  it('should return 400 for non-numeric days parameter', async () => {
    // ACT: Make a request with non-numeric days parameter
    server = app.listen(await getPort());
    const response = await request(server).get('/api/dashboard/stats?days=abc');
    server.close();

    // ASSERT: Verify error response
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe(
      "Invalid 'days' parameter. Must be a positive integer.",
    );
  });

  it('should default to 30 days when days parameter is not provided', async () => {
    // ARRANGE: Seed a job older than 30 days and one within 30 days
    const now = new Date();
    const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const testId = Math.random().toString(36).substring(7);

    await seedJobs([
      {
        id: `job-old-default-${testId}`,
        prompt: 'Old job',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: thirtyOneDaysAgo,
        costUsd: 1.0,
      },
      {
        id: `job-recent-default-${testId}`,
        prompt: 'Recent job',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: tenDaysAgo,
        costUsd: 2.0,
      },
    ]);

    // ACT: Make a request without days parameter
    server = app.listen(await getPort());
    const response = await request(server).get('/api/dashboard/stats');
    server.close();

    // ASSERT: Verify only the recent job is included (default 30 days)
    expect(response.status).toBe(200);
    const gptCost = response.body.costByModel.find(
      (item: unknown) => (item as any).model === 'gpt-4o-mini',
    );
    expect((gptCost as any).totalCost).toBeCloseTo(2.0); // Only the recent job
  });

  it('should return empty arrays when no jobs exist in the specified range', async () => {
    // ARRANGE: Seed a job older than the query range
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

    const testId = Math.random().toString(36).substring(7);

    await seedJobs([
      {
        id: `job-old-empty-${testId}`,
        prompt: 'Old job',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: fortyDaysAgo,
        costUsd: 1.0,
      },
    ]);

    // ACT: Make a request for last 30 days
    server = app.listen(await getPort());
    const response = await request(server).get('/api/dashboard/stats?days=30');
    server.close();

    // ASSERT: Verify empty arrays are returned
    expect(response.status).toBe(200);
    expect(response.body.scoreHistory).toEqual([]);
    expect(response.body.costByModel).toEqual([]);
  });

  it('should handle jobs without metrics gracefully', async () => {
    // ARRANGE: Seed jobs with and without metrics
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const testId = Math.random().toString(36).substring(7);

    await seedJobs([
      {
        id: `job-with-metrics-graceful-${testId}`,
        prompt: 'Job with metrics',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: yesterday,
        metrics: JSON.stringify({ scores: { accuracy: 0.8, relevance: 0.9 } }),
        costUsd: 1.0,
      },
      {
        id: `job-without-metrics-graceful-${testId}`,
        prompt: 'Job without metrics',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: yesterday,
        metrics: null,
        costUsd: 2.0,
      },
    ]);

    // ACT: Make a request to the dashboard stats endpoint
    const response = await request(server).get('/api/dashboard/stats?days=30');

    // ASSERT: Verify the endpoint handles null metrics gracefully
    expect(response.status).toBe(200);

    // Cost aggregation should still work
    const gptCost = response.body.costByModel.find(
      (item: unknown) => (item as any).model === 'gpt-4o-mini',
    );
    expect((gptCost as any).totalCost).toBeCloseTo(3.0); // 1.0 + 2.0

    // Score history should handle null metrics (averaging only valid scores)
    expect(Array.isArray(response.body.scoreHistory)).toBe(true);
  });
});
