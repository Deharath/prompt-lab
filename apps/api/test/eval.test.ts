import request from 'supertest';
import { beforeAll, afterAll, describe, it } from 'vitest';
import { app } from '../src/index';

let server: ReturnType<typeof app.listen>;

beforeAll(() => {
  server = app.listen(3001);
});

afterAll(() => {
  server.close();
});

describe('POST /eval', () => {
  it('echoes validated body', async () => {
    const payload = {
      promptTemplate: 'Hello, {{name}}',
      model: 'gpt-4',
      testSetId: '1',
    };

    await request('http://localhost:3001')
      .post('/eval')
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(payload);
  });
});
