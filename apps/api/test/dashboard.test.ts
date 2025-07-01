import type { Server } from 'http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import fs from 'node:fs';
import path from 'node:path';
import { getDb, jobs } from '@prompt-lab/api';
import type { NewJob } from '@prompt-lab/api';
import { app } from '../src/index.ts';

const TEST_DB_PATH = path.join(__dirname, './dashboard-test-db.sqlite');
process.env.DATABASE_URL = TEST_DB_PATH;

async function seedJobs(jobsToCreate: NewJob[]) {
  const db = await getDb();
  await db.insert(jobs).values(jobsToCreate);
  return jobsToCreate;
}

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

describe('Dashboard Stats API', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(async () => {
    const port = await getPort();
    server = app.listen(port);
    request = supertest(app);
  });

  afterEach(async () => {
    if (server) {
      server.close();
    }
  });

  it('returns aggregated statistics', async () => {
    const now = new Date();
    await seedJobs([
      {
        id: 'job-1',
        prompt: 'a',
        provider: 'openai',
        model: 'gpt-4o-mini',
        createdAt: new Date(now.getTime() - 10 * 86400000),
        costUsd: 0.5,
        metrics: {
          totalTokens: 10,
          avgCosSim: 0.9,
          meanLatencyMs: 100,
          costUsd: 0.5,
          evaluationCases: 1,
          startTime: 0,
          endTime: 0,
          avgScore: 0.8,
        },
      },
      {
        id: 'job-2',
        prompt: 'b',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        createdAt: new Date(now.getTime() - 5 * 86400000),
        costUsd: 0.25,
        metrics: {
          totalTokens: 5,
          avgCosSim: 0.8,
          meanLatencyMs: 50,
          costUsd: 0.25,
          evaluationCases: 1,
          startTime: 0,
          endTime: 0,
          avgScore: 0.6,
        },
      },
      {
        id: 'job-3',
        prompt: 'c',
        provider: 'openai',
        model: 'gpt-4o-mini',
        createdAt: new Date(now.getTime() - 5 * 86400000),
        costUsd: 0.75,
        metrics: {
          totalTokens: 8,
          avgCosSim: 0.95,
          meanLatencyMs: 70,
          costUsd: 0.75,
          evaluationCases: 1,
          startTime: 0,
          endTime: 0,
          avgScore: 0.9,
        },
      },
    ]);

    const res = await request.get('/dashboard/stats?days=30');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('scoreHistory');
    expect(res.body).toHaveProperty('costByModel');

    const date1 = new Date(now.getTime() - 10 * 86400000)
      .toISOString()
      .slice(0, 10);
    const date2 = new Date(now.getTime() - 5 * 86400000)
      .toISOString()
      .slice(0, 10);

    expect(res.body.scoreHistory).toEqual([
      { date: date1, avgScore: 0.8 },
      { date: date2, avgScore: 0.75 },
    ]);

    expect(res.body.costByModel).toEqual(
      expect.arrayContaining([
        { model: 'gpt-4o-mini', totalCost: 1.25 },
        { model: 'gemini-2.5-flash', totalCost: 0.25 },
      ]),
    );
  });

  it('rejects invalid days parameter', async () => {
    const res = await request.get('/dashboard/stats?days=-5');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "Invalid 'days' parameter. Must be a positive integer.",
    );
  });

  it('returns empty arrays when no data', async () => {
    const res = await request.get('/dashboard/stats?days=1');
    expect(res.status).toBe(200);
    expect(res.body.scoreHistory).toEqual([]);
    expect(res.body.costByModel).toEqual([]);
  });
});
