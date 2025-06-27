import request from 'supertest';
import { describe, it, expect } from 'vitest';
import {
  mockCheckOpenAI,
  mockCheckGemini,
  mockCheckDatabase,
  mockConfig,
} from './setupTests';
import { app } from '../src/index';

describe('GET /health', () => {
  it('responds with healthy status and detailed information', async () => {
    // ARRANGE: Ensure all services are healthy (default state)
    mockCheckOpenAI.mockResolvedValue('healthy');
    mockCheckGemini.mockResolvedValue('healthy');
    mockCheckDatabase.mockResolvedValue('healthy');

    const response = await request(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/);

    // ASSERT: Validate the response structure
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('dependencies');
    expect(response.body).toHaveProperty('metrics');

    // Validate dependencies
    expect(response.body.dependencies).toHaveProperty('database', 'healthy');
    expect(response.body.dependencies).toHaveProperty('openai', 'healthy');
    expect(response.body.dependencies).toHaveProperty('gemini', 'healthy');

    // Validate metrics structure
    expect(response.body.metrics).toHaveProperty('memoryUsage');
    expect(response.body.metrics).toHaveProperty('cpuUsage');
  });

  it('responds with degraded status when OpenAI is degraded', async () => {
    // ARRANGE: Simulate degraded OpenAI service by removing the API key
    const originalApiKey = mockConfig.openai.apiKey;
    mockConfig.openai.apiKey = undefined as any; // This triggers degraded state

    const response = await request(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/);

    // ASSERT: Should report degraded status
    expect(response.body).toHaveProperty('status', 'degraded');
    expect(response.body.dependencies).toHaveProperty('openai', 'degraded');

    // CLEANUP: Restore original API key
    mockConfig.openai.apiKey = originalApiKey;
  });
});
