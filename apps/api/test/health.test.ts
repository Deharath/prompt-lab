import request from 'supertest';
import { describe, it } from 'vitest';
import { app } from '../src/index.js';

process.env.PORT = process.env.PORT || '3000';

describe('GET /health', () => {
  it('responds with status ok', async () => {
    await request(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({ status: 'ok' });
  });
});
