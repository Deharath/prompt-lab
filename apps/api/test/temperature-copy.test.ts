import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import getPort from 'get-port';
import type { Server } from 'http';
import { app } from '../src/index.js';
import { setProvider, resetProviders, type LLMProvider } from '@prompt-lab/api';

// Create a mock provider
const mockProvider: LLMProvider = {
  name: 'openai',
  models: ['gpt-4o-mini'],
  complete: vi.fn().mockResolvedValue({
    output: 'This is a mocked response',
    tokens: 10,
    cost: 0.001,
  }),
  stream: vi.fn().mockImplementation(async function* () {
    yield { content: 'This is a mocked', isFinal: false };
    yield { content: ' response', isFinal: true };
    return; // This will set done: true
  }),
};

describe('Temperature Parameter E2E Test', () => {
  let server: Server;
  let apiRequest: ReturnType<typeof request>;

  beforeEach(async () => {
    // Set up mock provider
    setProvider('openai', mockProvider);

    const port = await getPort();
    server = app.listen(port);
    apiRequest = request(app);
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
    // Restore original providers
    resetProviders();
  });

  it('should pass temperature parameter to job creation', async () => {
    // ARRANGE: Create a job with temperature parameter
    const response = await apiRequest
      .post('/jobs')
      .send({
        prompt: 'Test prompt for temperature parameter',
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.25,
      })
      .expect(202);

    const jobId = response.body.id;
    expect(jobId).toBeDefined();

    // ACT & ASSERT: Verify the job was created with the temperature parameter
    const getResponse = await apiRequest.get(`/jobs/${jobId}`).expect(200);
    const job = getResponse.body;

    // Verify the temperature parameter is stored
    expect(job.temperature).toBe(0.25);
    expect(job.provider).toBe('openai');
    expect(job.model).toBe('gpt-4o-mini');
    expect(job.status).toBe('pending');
  }, 10000);
});
