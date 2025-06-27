import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '../src/index.ts';

process.env.PORT = process.env.PORT || '3000';

describe('GET /health', () => {
  it('responds with healthy status and detailed information', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/);

    // Validate the response structure
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
});
