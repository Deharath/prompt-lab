// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, it } from 'vitest';
import { app } from '../dist/src/index.js';
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
