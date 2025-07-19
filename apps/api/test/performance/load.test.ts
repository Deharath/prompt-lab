/**
 * API Load Testing Suite - Phase 4.2 Performance Tests
 * Tests API endpoints under concurrent load and validates performance thresholds
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';

describe('API Load Testing', () => {
  beforeAll(() => {
    // Set longer timeout for load tests
    vi.setConfig({ testTimeout: 30000 });
  });

  afterAll(() => {
    // Reset timeout
    vi.setConfig({ testTimeout: 5000 });
  });

  describe('Job Creation Load Tests', () => {
    it('should handle 10 concurrent job creations', async () => {
      const startTime = Date.now();
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/jobs')
          .send({
            prompt: `Load test prompt ${i}`,
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.7,
            topP: 0.9,
            maxTokens: 1000,
          })
          .expect(202),
      );

      const results = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.body).toHaveProperty('id');
        expect(result.body.status).toBe('pending');
      });

      // Performance assertions
      expect(totalTime).toBeLessThan(5000); // All requests should complete within 5 seconds
      console.log(`✓ 10 concurrent job creations completed in ${totalTime}ms`);
    });

    it('should handle burst load of 25 requests', async () => {
      const startTime = Date.now();
      const burstRequests = Array.from({ length: 25 }, (_, i) =>
        request(app)
          .post('/jobs')
          .send({
            prompt: `Burst test ${i}`,
            provider: 'openai',
            model: 'gpt-4o-mini',
          })
          .expect(202),
      );

      const results = await Promise.all(burstRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(25);
      expect(totalTime).toBeLessThan(10000); // 25 requests should complete within 10 seconds
      console.log(`✓ 25 burst requests completed in ${totalTime}ms`);
    });
  });

  describe('Health Endpoint Load Tests', () => {
    it('should handle 50 concurrent health checks', async () => {
      const startTime = Date.now();
      const healthRequests = Array.from({ length: 50 }, () =>
        request(app).get('/health').expect(200),
      );

      const results = await Promise.all(healthRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(50);
      expect(totalTime).toBeLessThan(3000); // Health checks should be very fast
      console.log(`✓ 50 concurrent health checks completed in ${totalTime}ms`);
    });
  });

  describe('Dashboard Stats Load Tests', () => {
    it('should handle 20 concurrent dashboard stats requests', async () => {
      const startTime = Date.now();
      const statsRequests = Array.from({ length: 20 }, () =>
        request(app).get('/api/dashboard/stats').expect(200),
      );

      const results = await Promise.all(statsRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(20);
      expect(totalTime).toBeLessThan(8000); // Stats aggregation under load
      console.log(
        `✓ 20 concurrent dashboard stats requests completed in ${totalTime}ms`,
      );
    });
  });

  describe('Database Connection Pool Tests', () => {
    it('should maintain performance under database stress', async () => {
      // Create multiple jobs to stress the database
      const createJobs = Array.from({ length: 15 }, (_, i) =>
        request(app)
          .post('/jobs')
          .send({
            prompt: `DB stress test ${i}`,
            provider: 'openai',
            model: 'gpt-4o-mini',
          })
          .expect(202),
      );

      const createdJobs = await Promise.all(createJobs);

      // Now perform concurrent reads
      const startTime = Date.now();
      const readRequests = createdJobs.map((job) =>
        request(app).get(`/jobs/${job.body.id}`).expect(200),
      );

      const results = await Promise.all(readRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(15);
      expect(totalTime).toBeLessThan(3000); // Database reads should be fast
      console.log(`✓ 15 concurrent database reads completed in ${totalTime}ms`);
    });
  });

  describe('Mixed Load Tests', () => {
    it('should handle mixed API operations under load', async () => {
      const startTime = Date.now();

      // Mix of different API calls
      const mixedRequests = [
        // Health checks (fast)
        ...Array.from({ length: 10 }, () =>
          request(app).get('/health').expect(200),
        ),
        // Job creations (medium)
        ...Array.from({ length: 8 }, (_, i) =>
          request(app)
            .post('/jobs')
            .send({
              prompt: `Mixed load test ${i}`,
              provider: 'openai',
              model: 'gpt-4o-mini',
            })
            .expect(202),
        ),
        // Dashboard stats (slower)
        ...Array.from({ length: 5 }, () =>
          request(app).get('/api/dashboard/stats').expect(200),
        ),
        // Recent jobs
        ...Array.from({ length: 7 }, () =>
          request(app).get('/api/dashboard/recent').expect(200),
        ),
      ];

      const results = await Promise.all(mixedRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(30);
      expect(totalTime).toBeLessThan(12000); // Mixed load should complete within 12 seconds
      console.log(`✓ 30 mixed API requests completed in ${totalTime}ms`);
    });
  });

  describe('Large Dataset Handling', () => {
    it('should handle large prompt templates efficiently', async () => {
      // Create a large prompt template (10KB+)
      const largeTemplate =
        'Generate a comprehensive analysis of '.repeat(500) + '{{topic}}';

      const startTime = Date.now();
      const response = await request(app)
        .post('/jobs')
        .send({
          prompt: largeTemplate,
          template: largeTemplate,
          inputData: JSON.stringify({
            topic: 'machine learning in healthcare',
          }),
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 2000,
        })
        .expect(202);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body).toHaveProperty('id');
      expect(response.body.template).toBe(largeTemplate);
      expect(processingTime).toBeLessThan(2000); // Large templates should still process quickly
      console.log(
        `✓ Large template (${largeTemplate.length} chars) processed in ${processingTime}ms`,
      );
    });

    it('should handle complex JSON input data', async () => {
      const complexInputData = JSON.stringify({
        users: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          preferences: {
            language: 'en',
            theme: i % 2 === 0 ? 'dark' : 'light',
            features: [`feature_${i}`, `feature_${i + 1}`],
          },
        })),
        metadata: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          settings: {
            enableFeatureA: true,
            maxItems: 1000,
            description: 'A'.repeat(500), // Large description
          },
        },
      });

      const startTime = Date.now();
      const response = await request(app)
        .post('/jobs')
        .send({
          prompt: 'Process this complex data: {{data}}',
          template: 'Process this complex data: {{data}}',
          inputData: complexInputData,
          provider: 'openai',
          model: 'gpt-4o-mini',
        })
        .expect(202);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body).toHaveProperty('id');
      expect(processingTime).toBeLessThan(1500); // Complex JSON should process efficiently
      console.log(
        `✓ Complex JSON input (${complexInputData.length} chars) processed in ${processingTime}ms`,
      );
    });
  });

  describe('Performance Regression Detection', () => {
    it('should establish baseline performance metrics', async () => {
      const benchmarks = {
        healthCheck: { target: 50, threshold: 100 },
        jobCreation: { target: 200, threshold: 500 },
        jobRetrieval: { target: 100, threshold: 300 },
        dashboardStats: { target: 400, threshold: 800 },
      };

      // Health check benchmark
      const healthStart = Date.now();
      await request(app).get('/health').expect(200);
      const healthTime = Date.now() - healthStart;
      expect(healthTime).toBeLessThan(benchmarks.healthCheck.threshold);

      // Job creation benchmark
      const jobStart = Date.now();
      const jobResponse = await request(app)
        .post('/jobs')
        .send({
          prompt: 'Benchmark test',
          provider: 'openai',
          model: 'gpt-4o-mini',
        })
        .expect(202);
      const jobTime = Date.now() - jobStart;
      expect(jobTime).toBeLessThan(benchmarks.jobCreation.threshold);

      // Job retrieval benchmark
      const retrievalStart = Date.now();
      await request(app).get(`/jobs/${jobResponse.body.id}`).expect(200);
      const retrievalTime = Date.now() - retrievalStart;
      expect(retrievalTime).toBeLessThan(benchmarks.jobRetrieval.threshold);

      // Dashboard stats benchmark
      const statsStart = Date.now();
      await request(app).get('/api/dashboard/stats').expect(200);
      const statsTime = Date.now() - statsStart;
      expect(statsTime).toBeLessThan(benchmarks.dashboardStats.threshold);

      console.log('\n📊 Performance Benchmarks:');
      console.log(
        `  Health Check: ${healthTime}ms (target: ${benchmarks.healthCheck.target}ms)`,
      );
      console.log(
        `  Job Creation: ${jobTime}ms (target: ${benchmarks.jobCreation.target}ms)`,
      );
      console.log(
        `  Job Retrieval: ${retrievalTime}ms (target: ${benchmarks.jobRetrieval.target}ms)`,
      );
      console.log(
        `  Dashboard Stats: ${statsTime}ms (target: ${benchmarks.dashboardStats.target}ms)`,
      );
    });
  });
});
