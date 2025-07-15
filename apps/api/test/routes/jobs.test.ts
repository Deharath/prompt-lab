import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import {
  mockJobStore,
  mockCreateJob,
  mockGetJob,
  mockUpdateJob,
  mockListJobs,
  mockDeleteJob,
  mockGetPreviousJob,
  mockRetryJob,
} from '../setupTests.js';

// Mock the retryJob function
vi.mock('@prompt-lab/evaluation-engine', async () => {
  const actual = await vi.importActual('@prompt-lab/evaluation-engine');
  return {
    ...actual,
    retryJob: vi.fn(),
  };
});

// Add the mock to setupTests exports
const mockRetryJobFn = vi.fn();

describe('Jobs API', () => {
  beforeEach(() => {
    mockJobStore.clear();
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    mockCreateJob.mockImplementation(async (data) => {
      const id = `job-${Date.now()}`;
      const newJob = {
        id,
        ...data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockJobStore.set(id, newJob);
      return newJob;
    });

    mockGetJob.mockImplementation(async (id) => {
      return mockJobStore.get(id) || null;
    });

    mockUpdateJob.mockImplementation(async (id, updateData) => {
      const job = mockJobStore.get(id);
      if (!job) return null;
      const updatedJob = { ...job, ...updateData, updatedAt: new Date() };
      mockJobStore.set(id, updatedJob);
      return updatedJob;
    });

    mockListJobs.mockImplementation(async (options = {}) => {
      const { limit = 20, offset = 0 } = options;
      const jobs = Array.from(mockJobStore.values());
      jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return jobs.slice(offset, offset + limit);
    });

    mockDeleteJob.mockImplementation(async (id) => {
      const exists = mockJobStore.has(id);
      if (exists) {
        mockJobStore.delete(id);
      }
      return exists;
    });

    mockGetPreviousJob.mockImplementation(async (currentJobId) => {
      const allJobs = Array.from(mockJobStore.values());
      allJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const currentIndex = allJobs.findIndex((job) => job.id === currentJobId);
      return currentIndex > 0 ? allJobs[currentIndex - 1] : null;
    });

    mockRetryJobFn.mockImplementation(async (id) => {
      const originalJob = mockJobStore.get(id);
      if (!originalJob) return null;

      const newJob = {
        ...originalJob,
        id: `job-${Date.now()}-retry`,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockJobStore.set(newJob.id, newJob);
      return newJob;
    });
  });

  describe('POST /jobs', () => {
    it('should create a new job with valid data', async () => {
      const jobData = {
        prompt: 'Test prompt',
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 1000,
      };

      const response = await request(app)
        .post('/jobs')
        .send(jobData)
        .expect(202);

      expect(response.body).toHaveProperty('id');
      expect(response.body.prompt).toBe(jobData.prompt);
      expect(response.body.provider).toBe(jobData.provider);
      expect(response.body.model).toBe(jobData.model);
      expect(response.body.status).toBe('pending');
      expect(mockCreateJob).toHaveBeenCalledWith(
        expect.objectContaining(jobData),
      );
    });

    it('should reject invalid job data', async () => {
      const invalidJobData = {
        prompt: '', // Empty prompt
        provider: 'openai',
        model: 'gpt-4o-mini',
      };

      await request(app).post('/jobs').send(invalidJobData).expect(400);
    });

    it('should reject unsupported provider', async () => {
      const jobData = {
        prompt: 'Test prompt',
        provider: 'unsupported-provider',
        model: 'some-model',
      };

      await request(app).post('/jobs').send(jobData).expect(400);
    });

    it('should accept template and inputData', async () => {
      const jobData = {
        prompt: 'Hello {{name}}',
        template: 'Hello {{name}}',
        inputData: '{"name": "World"}',
        provider: 'openai',
        model: 'gpt-4o-mini',
      };

      const response = await request(app)
        .post('/jobs')
        .send(jobData)
        .expect(202);

      expect(response.body.template).toBe(jobData.template);
      expect(response.body.inputData).toBe(jobData.inputData);
    });
  });

  describe('GET /jobs', () => {
    beforeEach(async () => {
      // Create test jobs
      await mockCreateJob({
        prompt: 'Test 1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
      });
      await mockCreateJob({
        prompt: 'Test 2',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        status: 'pending',
      });
    });

    it('should list jobs with default pagination', async () => {
      const response = await request(app).get('/jobs').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(mockListJobs).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    });

    it('should accept limit and offset parameters', async () => {
      const response = await request(app)
        .get('/jobs?limit=1&offset=1')
        .expect(200);

      expect(mockListJobs).toHaveBeenCalledWith({ limit: 1, offset: 1 });
    });

    it('should validate limit parameter', async () => {
      await request(app).get('/jobs?limit=0').expect(400);

      await request(app).get('/jobs?limit=101').expect(400);
    });

    it('should validate offset parameter', async () => {
      await request(app).get('/jobs?offset=-1').expect(400);
    });

    it('should filter by provider', async () => {
      await request(app).get('/jobs?provider=openai').expect(200);

      expect(mockListJobs).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        provider: 'openai',
      });
    });

    it('should filter by status', async () => {
      await request(app).get('/jobs?status=completed').expect(200);

      expect(mockListJobs).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        status: 'completed',
      });
    });
  });

  describe('GET /jobs/:id', () => {
    it('should return job by id', async () => {
      const job = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const response = await request(app).get(`/jobs/${job.id}`).expect(200);

      expect(response.body.id).toBe(job.id);
      expect(response.body.prompt).toBe('Test');
      expect(mockGetJob).toHaveBeenCalledWith(job.id);
    });

    it('should return 404 for non-existent job', async () => {
      await request(app).get('/jobs/non-existent-id').expect(404);
    });
  });

  describe('GET /jobs/:id/stream', () => {
    it('should return completed job data if job is already completed', async () => {
      const job = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
        result: 'Test result',
        metrics: { word_count: 2 },
      });

      const response = await request(app)
        .get(`/jobs/${job.id}/stream`)
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.result).toBe('Test result');
      expect(response.body.metrics).toEqual({ word_count: 2 });
    });

    it('should return 404 for non-existent job', async () => {
      await request(app).get('/jobs/non-existent-id/stream').expect(404);
    });

    it('should return cancelled job data', async () => {
      const job = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'cancelled',
        result: 'Partial result',
      });

      const response = await request(app)
        .get(`/jobs/${job.id}/stream`)
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.message).toBe('Job was cancelled');
    });
  });

  describe('GET /jobs/:id/diff', () => {
    it('should compare job with previous job', async () => {
      const job1 = await mockCreateJob({
        prompt: 'Test 1',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const job2 = await mockCreateJob({
        prompt: 'Test 2',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const response = await request(app)
        .get(`/jobs/${job2.id}/diff`)
        .expect(200);

      expect(response.body.baseJob.id).toBe(job2.id);
      expect(response.body.compareJob.id).toBe(job1.id);
    });

    it('should compare job with specified other job', async () => {
      const job1 = await mockCreateJob({
        prompt: 'Test 1',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const job2 = await mockCreateJob({
        prompt: 'Test 2',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const response = await request(app)
        .get(`/jobs/${job2.id}/diff?otherId=${job1.id}`)
        .expect(200);

      expect(response.body.baseJob.id).toBe(job2.id);
      expect(response.body.compareJob.id).toBe(job1.id);
    });

    it('should return 404 for non-existent base job', async () => {
      await request(app).get('/jobs/non-existent-id/diff').expect(404);
    });

    it('should return 404 for non-existent compare job', async () => {
      const job = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      await request(app)
        .get(`/jobs/${job.id}/diff?otherId=non-existent-id`)
        .expect(404);
    });
  });

  describe('DELETE /jobs/:id', () => {
    it('should delete existing job', async () => {
      const job = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      await request(app).delete(`/jobs/${job.id}`).expect(204);

      expect(mockDeleteJob).toHaveBeenCalledWith(job.id);
    });

    it('should return 404 for non-existent job', async () => {
      await request(app).delete('/jobs/non-existent-id').expect(404);
    });
  });

  describe('PUT /jobs/:id/cancel', () => {
    it('should cancel running job', async () => {
      const job = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'running',
      });

      const response = await request(app)
        .put(`/jobs/${job.id}/cancel`)
        .expect(200);

      expect(response.body.message).toBe('Job cancelled successfully');
      expect(response.body.job.status).toBe('cancelled');
      expect(mockUpdateJob).toHaveBeenCalledWith(
        job.id,
        expect.objectContaining({
          status: 'cancelled',
          errorMessage: 'Job cancelled by user',
        }),
      );
    });

    it('should cancel pending job', async () => {
      const job = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'pending',
      });

      const response = await request(app)
        .put(`/jobs/${job.id}/cancel`)
        .expect(200);

      expect(response.body.message).toBe('Job cancelled successfully');
    });

    it('should not cancel completed job', async () => {
      const job = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'completed',
      });

      const response = await request(app)
        .put(`/jobs/${job.id}/cancel`)
        .expect(400);

      expect(response.body.error).toContain('Cannot cancel job with status');
    });

    it('should return 404 for non-existent job', async () => {
      await request(app).put('/jobs/non-existent-id/cancel').expect(404);
    });
  });

  describe('POST /jobs/:id/retry', () => {
    it('should retry failed job', async () => {
      const originalJob = await mockCreateJob({
        prompt: 'Test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        status: 'failed',
      });

      // Mock the retry function
      const { retryJob } = await import('@prompt-lab/evaluation-engine');
      vi.mocked(retryJob).mockResolvedValue({
        ...originalJob,
        id: `${originalJob.id}-retry`,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post(`/jobs/${originalJob.id}/retry`)
        .expect(201);

      expect(response.body.message).toBe('Job retry created successfully');
      expect(response.body.originalJobId).toBe(originalJob.id);
      expect(response.body.newJob.id).toBe(`${originalJob.id}-retry`);
      expect(response.body.newJob.status).toBe('pending');
    });

    it('should return 404 for non-existent job', async () => {
      const { retryJob } = await import('@prompt-lab/evaluation-engine');
      vi.mocked(retryJob).mockResolvedValue(null);

      await request(app).post('/jobs/non-existent-id/retry').expect(404);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockCreateJob.mockRejectedValue(new Error('Database error'));

      await request(app)
        .post('/jobs')
        .send({
          prompt: 'Test',
          provider: 'openai',
          model: 'gpt-4o-mini',
        })
        .expect(500);
    });

    it('should handle provider errors gracefully', async () => {
      mockGetJob.mockRejectedValue(new Error('Provider error'));

      await request(app).get('/jobs/some-id').expect(500);
    });
  });
});
