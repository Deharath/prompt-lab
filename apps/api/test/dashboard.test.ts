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

describe('GET /api/dashboard/stats', () => {
  it('returns aggregated stats for the given time range', async () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 86400000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000);
    await seedJobs([
      {
        id: 'job-1',
        prompt: 'a',
        provider: 'openai',
        model: 'gpt-4o-mini',
        metrics: { avgScore: 0.9 },
        costUsd: 1.0,
        createdAt: tenDaysAgo,
      },
      {
        id: 'job-2',
        prompt: 'b',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        metrics: { avgScore: 0.8 },
        costUsd: 0.5,
        createdAt: tenDaysAgo,
      },
      {
        id: 'job-3',
        prompt: 'c',
        provider: 'openai',
        model: 'gpt-4o-mini',
        metrics: { avgScore: 1.0 },
        costUsd: 0.25,
        createdAt: fiveDaysAgo,
      },
      {
        id: 'job-old',
        prompt: 'old',
        provider: 'openai',
        model: 'gpt-4o-mini',
        metrics: { avgScore: 0.5 },
        costUsd: 0.1,
        createdAt: new Date(now.getTime() - 35 * 86400000),
      },
    ]);

    const res = await request.get('/api/dashboard/stats?days=30').expect(200);

    expect(res.body).toHaveProperty('scoreHistory');
    expect(res.body).toHaveProperty('costByModel');
    expect(Array.isArray(res.body.scoreHistory)).toBe(true);
    expect(Array.isArray(res.body.costByModel)).toBe(true);

    const dateTen = tenDaysAgo.toISOString().slice(0, 10);
    const dateFive = fiveDaysAgo.toISOString().slice(0, 10);

    const expectedScoreHistory = [
      { date: dateTen, avgScore: 0.85 },
      { date: dateFive, avgScore: 1.0 },
    ];
    const expectedCostByModel = [
      { model: 'gpt-4o-mini', totalCost: 1.25 },
      { model: 'gemini-2.5-flash', totalCost: 0.5 },
    ];

    expect(res.body.scoreHistory).toEqual(expectedScoreHistory);
    expect(res.body.costByModel).toEqual(expectedCostByModel);
  });

  it('returns 400 for invalid days parameter', async () => {
    const res = await request.get('/api/dashboard/stats?days=-5').expect(400);
    expect(res.body).toHaveProperty(
      'error',
      "Invalid 'days' parameter. Must be a positive integer.",
    );
  });

  it('returns empty arrays when no jobs in range', async () => {
    const now = new Date();
    await seedJobs([
      {
        id: 'old-job',
        prompt: 'x',
        provider: 'openai',
        model: 'gpt-4o-mini',
        metrics: { avgScore: 0.7 },
        costUsd: 0.4,
        createdAt: new Date(now.getTime() - 40 * 86400000),
      },
    ]);

    const res = await request.get('/api/dashboard/stats?days=1').expect(200);
    expect(res.body.scoreHistory).toEqual([]);
    expect(res.body.costByModel).toEqual([]);
  });
});
