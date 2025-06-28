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

describe('GET /jobs', () => {
  it('returns paginated job summaries', async () => {
    // create two jobs
    await request(server).post('/jobs').send({
      prompt: 'Hello',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
    await request(server).post('/jobs').send({
      prompt: 'Hello again',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });

    const res = await request(server).get('/jobs?limit=1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    const job = res.body[0];
    expect(job).toHaveProperty('id');
    expect(job).toHaveProperty('createdAt');
    expect(job).toHaveProperty('provider');
    expect(job).toHaveProperty('model');
    expect(job).toHaveProperty('cost_usd');
    expect(job).toHaveProperty('avgScore');
  });
});
