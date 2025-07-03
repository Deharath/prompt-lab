import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import getPort from 'get-port';
import type { Server } from 'http';
import { app } from '../../api/src/index.js';

describe('API Timestamp Integration', () => {
  let server: Server;
  let apiRequest: request.SuperTest<request.Test>;

  beforeEach(async () => {
    const port = await getPort();
    server = app.listen(port);
    apiRequest = request(app);
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  it('should return ISO 8601 formatted createdAt field in job response', async () => {
    // ARRANGE: Create a new job via the API
    const createResponse = await apiRequest
      .post('/jobs')
      .send({
        prompt: 'Test prompt for timestamp verification',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    const jobId = createResponse.body.id;
    expect(jobId).toBeDefined();

    // ACT: Fetch the job via the GET /jobs/:id endpoint
    const getResponse = await apiRequest.get(`/jobs/${jobId}`).expect(200);

    // ASSERT: Verify that the createdAt field conforms to ISO 8601 format
    const job = getResponse.body;
    expect(job).toHaveProperty('createdAt');

    // Check that createdAt is a valid ISO 8601 string
    const createdAtString = job.createdAt;
    expect(typeof createdAtString).toBe('string');

    // Verify ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(createdAtString).toMatch(iso8601Regex);

    // Verify that the string can be parsed into a valid Date
    const parsedDate = new Date(createdAtString);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate.getTime()).not.toBeNaN();

    // Additional verification: the parsed date should be recent (within the last minute)
    const now = new Date();
    const timeDifference = now.getTime() - parsedDate.getTime();
    expect(timeDifference).toBeLessThan(60000); // Less than 60 seconds
  });
});
