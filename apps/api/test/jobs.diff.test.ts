import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import getPort from 'get-port';
import { app } from '../src/index';

let server: ReturnType<typeof app.listen>;
let port: number;

beforeAll(async () => {
  port = await getPort();
  server = app.listen(port);
});

afterAll(() => {
  server.close();
});

describe('GET /jobs/:id/diff', () => {
  it('returns diff with previous job when otherId not provided', async () => {
    const res1 = await request(server).post('/jobs').send({
      prompt: 'job1',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });

    const res2 = await request(server).post('/jobs').send({
      prompt: 'job2',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });

    const diffRes = await request(server).get(`/jobs/${res2.body.id}/diff`);
    expect(diffRes.status).toBe(200);
    expect(diffRes.body).toHaveProperty('baseJob');
    expect(diffRes.body).toHaveProperty('compareJob');
    expect(diffRes.body.baseJob.id).toBe(res2.body.id);
    expect(diffRes.body.compareJob.id).toBe(res1.body.id);
  });

  it('returns diff between specified jobs when otherId provided', async () => {
    const res1 = await request(server).post('/jobs').send({
      prompt: 'jobA',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });

    const res2 = await request(server).post('/jobs').send({
      prompt: 'jobB',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });

    const diffRes = await request(server)
      .get(`/jobs/${res1.body.id}/diff`)
      .query({ otherId: res2.body.id });

    expect(diffRes.status).toBe(200);
    expect(diffRes.body.baseJob.id).toBe(res1.body.id);
    expect(diffRes.body.compareJob.id).toBe(res2.body.id);
  });
});
