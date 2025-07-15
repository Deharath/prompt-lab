import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body).toHaveProperty('metrics');

      // Check dependencies structure
      expect(response.body.dependencies).toHaveProperty('database');
      expect(response.body.dependencies).toHaveProperty('openai');

      // Check metrics structure
      expect(response.body.metrics).toHaveProperty('memoryUsage');
      expect(response.body.metrics).toHaveProperty('cpuUsage');
    });

    it('should have database as healthy in test environment', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.dependencies.database).toBe('healthy');
    });

    it('should have openai as healthy in test environment', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.dependencies.openai).toBe('healthy');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 with ready status', async () => {
      const response = await request(app).get('/health/ready').expect(200);

      expect(response.body).toEqual({ status: 'ready' });
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 with alive status', async () => {
      const response = await request(app).get('/health/live').expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /health/ping', () => {
    it('should return 200 with pong status', async () => {
      const response = await request(app).get('/health/ping').expect(200);

      expect(response.body.status).toBe('pong');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
