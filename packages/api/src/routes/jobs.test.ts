import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import express, { Express } from 'express';
import fs from 'node:fs';
import jobsRouter from './jobs';
import { db } from '../db';
import * as JobService from '../jobs/service';

// Mock the providers module to avoid real API calls and control test behavior
vi.mock('../providers', async importOriginal => {
  const original = await importOriginal<typeof import('../providers')>();

  async function* mockCompleteSuccess() {
    yield 'Hel';
    yield 'lo';
    yield ' world';
  }

  async function* mockCompleteFailure() {
    yield 'This ';
    throw new Error('Provider failed spectacularly');
  }

  return {
    ...original,
    getProvider: (name: string) => {
      if (name === 'mock-success') {
        return { name: 'mock-success', models: ['default'], complete: mockCompleteSuccess };
      }
      if (name === 'mock-fail') {
        return { name: 'mock-fail', models: ['default'], complete: mockCompleteFailure };
      }
      return undefined;
    },
  };
});

const TEST_DB_FILE = 'test-e2e-sqlite.db';

describe('/jobs API endpoints', () => {
  let app: Express;

  beforeAll(() => {
    // In a real project, you'd use a dedicated test DB setup.
    // For this example, we ensure the test DB file doesn't exist.
    if (fs.existsSync(TEST_DB_FILE)) {
      fs.unlinkSync(TEST_DB_FILE);
    }
    process.env.DATABASE_URL = TEST_DB_FILE;

    // Manually create table for tests since we don't run migrations here.
    db.run(
      'CREATE TABLE jobs (id TEXT PRIMARY KEY, prompt TEXT NOT NULL, provider TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL, result TEXT, metrics TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)' as any
    );

    app = express();
    app.use(express.json());
    app.use('/jobs', jobsRouter);
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DB_FILE)) {
      fs.unlinkSync(TEST_DB_FILE);
    }
  });

  it('POST /jobs should create a job and return 202', async () => {
    const response = await supertest(app)
      .post('/jobs')
      .send({ prompt: 'test prompt', provider: 'mock-success', model: 'default' });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('pending');
  });

  it('GET /jobs/:id/stream should stream tokens and a final metrics event for a successful job', async () => {
    const createRes = await supertest(app)
      .post('/jobs')
      .send({ prompt: 'a successful run', provider: 'mock-success', model: 'default' });
    const { id } = createRes.body;

    const streamRes = await supertest(app).get(`/jobs/${id}/stream`);

    expect(streamRes.status).toBe(200);
    expect(streamRes.headers['content-type']).toBe('text/event-stream');

    const events = streamRes.text.split('\n\n').filter(Boolean);
    expect(events).toHaveLength(4); // 3 tokens + 1 metrics
    expect(events[0]).toBe('data: {"token":"Hel"}');
    expect(events[1]).toBe('data: {"token":"lo"}');
    expect(events[2]).toBe('data: {"token":" world"}');
    expect(events[3]).toMatch(/^event: metrics\ndata: {"durationMs":\d+,"tokenCount":2}}$/);

    const job = await JobService.getJob(id);
    expect(job?.status).toBe('completed');
    expect(job?.result).toBe('Hello world');
  });

  it('GET /jobs/:id/stream should stream an error event for a failed job', async () => {
    const createRes = await supertest(app)
      .post('/jobs')
      .send({ prompt: 'a failing run', provider: 'mock-fail', model: 'default' });
    const { id } = createRes.body;

    const streamRes = await supertest(app).get(`/jobs/${id}/stream`);
    const events = streamRes.text.split('\n\n').filter(Boolean);

    expect(events).toHaveLength(2); // 1 token + 1 error
    expect(events[0]).toBe('data: {"token":"This "}')
    expect(events[1]).toBe('event: error\ndata: {"error":"Provider failed spectacularly"}');

    const job = await JobService.getJob(id);
    expect(job?.status).toBe('failed');
  });
});
