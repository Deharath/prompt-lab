import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Express } from 'express';
import type { Server } from 'http';
import type supertest from 'supertest';

let app: Express;
let getDb: unknown;
let resetDb: unknown;
let jobs: unknown;
let request: typeof supertest;
let getPort: () => Promise<number>;
let server: Server;

describe('Dashboard Cost Integration Tests', () => {
  beforeEach(async () => {
    // Reset modules and set up clean test environment
    const { vi } = await import('vitest');
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

    // Import other dependencies
    request = (await import('supertest')).default;
    getPort = (await import('get-port')).default;
    app = (await import('../src/index.ts')).app;
  });

  afterEach(async () => {
    if (server) {
      server.close();
    }
  });

  async function seedJobs(jobList: unknown[]) {
    if (typeof getDb === 'function' && jobs) {
      const db = await getDb();
      await db.insert(jobs).values(jobList);
    }
  }

  it('should correctly calculate totalCost = 3.0 for aggregated jobs', async () => {
    // ARRANGE: Create jobs with specific cost values that sum to 3.0
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const testId = Math.random().toString(36).substring(7);

    await seedJobs([
      {
        id: `cost-test-1-${testId}`,
        prompt: 'Cost calculation test job 1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: yesterday,
        costUsd: 1.0,
        result: 'Test result 1',
        metrics: JSON.stringify({
          totalTokens: 1000,
          avgCosSim: 0.9,
          meanLatencyMs: 150,
          costUsd: 1.0,
          evaluationCases: 1,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
        }),
      },
      {
        id: `cost-test-2-${testId}`,
        prompt: 'Cost calculation test job 2',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: yesterday,
        costUsd: 1.5,
        result: 'Test result 2',
        metrics: JSON.stringify({
          totalTokens: 1500,
          avgCosSim: 0.85,
          meanLatencyMs: 200,
          costUsd: 1.5,
          evaluationCases: 1,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
        }),
      },
      {
        id: `cost-test-3-${testId}`,
        prompt: 'Cost calculation test job 3',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        createdAt: yesterday,
        costUsd: 0.5,
        result: 'Test result 3',
        metrics: JSON.stringify({
          totalTokens: 500,
          avgCosSim: 0.95,
          meanLatencyMs: 100,
          costUsd: 0.5,
          evaluationCases: 1,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
        }),
      },
    ]);

    // ACT: Hit the dashboard API endpoint
    server = app.listen(await getPort());
    const response = await request(server).get('/api/dashboard/stats?days=30');
    server.close();

    // ASSERT: Verify totalCost is exactly 3.0 with acceptable float precision
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('costByModel');
    expect(Array.isArray(response.body.costByModel)).toBe(true);

    const gptModel = response.body.costByModel.find(
      (item: any) => item.model === 'gpt-4o-mini',
    );

    expect(gptModel).toBeDefined();
    expect(gptModel.totalCost).toBeCloseTo(3.0, 2); // Within 0.01 precision

    // Ensure the difference is within acceptable float error range
    const costDifference = Math.abs(gptModel.totalCost - 3.0);
    expect(costDifference).toBeLessThanOrEqual(0.01);
  });

  it('should handle cost aggregation with various precision values', async () => {
    // ARRANGE: Create jobs with decimal cost values
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const testId = Math.random().toString(36).substring(7);

    await seedJobs([
      {
        id: `precision-test-1-${testId}`,
        prompt: 'Precision test job 1',
        provider: 'openai',
        model: 'gpt-4o',
        status: 'completed',
        createdAt: yesterday,
        costUsd: 0.123,
        result: 'Test result',
        metrics: JSON.stringify({
          totalTokens: 100,
          costUsd: 0.123,
          evaluationCases: 1,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
        }),
      },
      {
        id: `precision-test-2-${testId}`,
        prompt: 'Precision test job 2',
        provider: 'openai',
        model: 'gpt-4o',
        status: 'completed',
        createdAt: yesterday,
        costUsd: 0.456,
        result: 'Test result',
        metrics: JSON.stringify({
          totalTokens: 200,
          costUsd: 0.456,
          evaluationCases: 1,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
        }),
      },
      {
        id: `precision-test-3-${testId}`,
        prompt: 'Precision test job 3',
        provider: 'openai',
        model: 'gpt-4o',
        status: 'completed',
        createdAt: yesterday,
        costUsd: 0.789,
        result: 'Test result',
        metrics: JSON.stringify({
          totalTokens: 300,
          costUsd: 0.789,
          evaluationCases: 1,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
        }),
      },
    ]);

    // ACT: Hit the dashboard API endpoint
    server = app.listen(await getPort());
    const response = await request(server).get('/api/dashboard/stats?days=30');
    server.close();

    // ASSERT: Verify cost aggregation with decimal precision
    expect(response.status).toBe(200);

    const gpt4Model = response.body.costByModel.find(
      (item: any) => item.model === 'gpt-4o',
    );

    expect(gpt4Model).toBeDefined();
    const expectedTotal = 0.123 + 0.456 + 0.789; // 1.368
    expect(gpt4Model.totalCost).toBeCloseTo(expectedTotal, 3);

    // Verify float precision within acceptable error
    const costDifference = Math.abs(gpt4Model.totalCost - expectedTotal);
    expect(costDifference).toBeLessThanOrEqual(0.001);
  });

  it('should handle null and undefined cost values gracefully', async () => {
    // ARRANGE: Create jobs with null/undefined costs
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const testId = Math.random().toString(36).substring(7);

    await seedJobs([
      {
        id: `null-cost-1-${testId}`,
        prompt: 'Null cost test job',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        status: 'completed',
        createdAt: yesterday,
        costUsd: null,
        result: 'Test result',
      },
      {
        id: `valid-cost-1-${testId}`,
        prompt: 'Valid cost test job',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        status: 'completed',
        createdAt: yesterday,
        costUsd: 2.5,
        result: 'Test result',
      },
    ]);

    // ACT: Hit the dashboard API endpoint
    server = app.listen(await getPort());
    const response = await request(server).get('/api/dashboard/stats?days=30');
    server.close();

    // ASSERT: Verify null costs are handled properly (treated as 0)
    expect(response.status).toBe(200);

    const gpt35Model = response.body.costByModel.find(
      (item: any) => item.model === 'gpt-3.5-turbo',
    );

    expect(gpt35Model).toBeDefined();
    expect(gpt35Model.totalCost).toBeCloseTo(2.5, 2); // Only the valid cost should be summed
  });
});
