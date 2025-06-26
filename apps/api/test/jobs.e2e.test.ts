import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import { app } from '../src/index.js';

let server: any;
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  // Set test environment variables
  process.env.GEMINI_API_KEY = 'test-key-for-e2e';
  
  const port = await getPort();
  server = app.listen(port);
  request = supertest(app);
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

describe('Jobs E2E Flow', () => {
  it('should create and stream a job end-to-end', async () => {
    // 1. Create a job
    const createResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Write a short story about a robot',
        provider: 'gemini',
        model: 'gemini-pro'
      })
      .expect(202);

    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.prompt).toBe('Write a short story about a robot');
    expect(createResponse.body.provider).toBe('gemini');
    expect(createResponse.body.model).toBe('gemini-pro');
    expect(createResponse.body.status).toBe('pending');

    const jobId = createResponse.body.id;

    // 2. Stream the job completion
    const streamResponse = await request
      .get(`/jobs/${jobId}/stream`)
      .expect(200);

    expect(streamResponse.headers['content-type']).toBe('text/event-stream');
    
    // Verify we got some content (the Gemini stub returns content)
    expect(streamResponse.text.length).toBeGreaterThan(0);
    expect(streamResponse.text).toContain('data:');
    
    // Should contain token events and a metrics event
    expect(streamResponse.text).toContain('"token"');
    expect(streamResponse.text).toContain('event: metrics');
  }, 10000); // Increase timeout for streaming test
});
