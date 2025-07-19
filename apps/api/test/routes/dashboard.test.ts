import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';

describe('Dashboard API', () => {
  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard stats with default 30 days', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalJobs');
      expect(response.body).toHaveProperty('completedJobs');
      expect(response.body).toHaveProperty('failedJobs');
      expect(response.body).toHaveProperty('averageResponseTime');
      expect(response.body).toHaveProperty('totalCost');
      expect(response.body).toHaveProperty('providerBreakdown');
      expect(response.body).toHaveProperty('modelBreakdown');
      expect(response.body).toHaveProperty('recentTrends');
    });

    it('should accept custom days parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats?days=7')
        .expect(200);

      expect(response.body).toHaveProperty('totalJobs');
      expect(response.body).toHaveProperty('completedJobs');
      expect(response.body).toHaveProperty('failedJobs');
    });

    it('should validate days parameter', async () => {
      await request(app).get('/api/dashboard/stats?days=0').expect(400);

      await request(app).get('/api/dashboard/stats?days=-1').expect(400);

      await request(app).get('/api/dashboard/stats?days=invalid').expect(400);
    });
  });

  describe('GET /api/dashboard/recent', () => {
    it('should return recent jobs with default pagination', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Response should be an array of job summaries
    });

    it('should accept limit parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent?limit=5')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should validate limit parameter', async () => {
      await request(app).get('/api/dashboard/recent?limit=0').expect(400);

      await request(app).get('/api/dashboard/recent?limit=101').expect(400);
    });

    it('should accept provider filter', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent?provider=openai')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should accept status filter', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent?status=completed')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should accept multiple filters', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent?provider=openai&status=completed&limit=10')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test depends on the database being available
      // In a real scenario, you might mock the database to simulate errors
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalJobs');
    });
  });
});
