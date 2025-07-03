import type { Request, Response, NextFunction, Router } from 'express';
import { Router as createRouter } from 'express';
import {
  createJob,
  getJob,
  updateJob,
  listJobs,
  getPreviousJob,
  getProvider,
  deleteJob,
  type Job,
} from '@prompt-lab/api';
import {
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
} from '../errors/ApiError.js';

// Import metric functions
import {
  calculateFleschReadingEase,
  calculateSentiment,
  checkJsonValidity,
  countWords,
  checkForKeywords,
  calculatePrecision,
  calculateRecall,
  calculateFScore,
  calculateMockLatency,
} from '@prompt-lab/api';

// Helper function to calculate selected metrics
function calculateSelectedMetrics(
  output: string,
  selectedMetrics?: unknown,
): Record<string, unknown> {
  if (!selectedMetrics || !Array.isArray(selectedMetrics)) {
    return {};
  }

  const metrics = selectedMetrics as Array<{ id: string; input?: string }>;
  const results: Record<string, unknown> = {};

  for (const metric of metrics) {
    switch (metric.id) {
      case 'flesch_reading_ease':
        results.flesch_reading_ease = calculateFleschReadingEase(output);
        break;
      case 'sentiment_score':
        results.sentiment_score = calculateSentiment(output);
        break;
      case 'is_valid_json':
        results.is_valid_json = checkJsonValidity(output);
        break;
      case 'word_count':
        results.word_count = countWords(output);
        break;
      case 'keywords':
        if (metric.input) {
          const keywords = metric.input.split(',').map((k) => k.trim());
          results.keywords = checkForKeywords(output, keywords);
        }
        break;
      case 'precision':
        // For precision, we'll use the output as prediction and a simple baseline as reference
        // In practice, this would be calculated against a proper reference
        results.precision = calculatePrecision(
          output,
          'baseline reference text',
        );
        break;
      case 'recall':
        // For recall, we'll use the output as prediction and a simple baseline as reference
        results.recall = calculateRecall(output, 'baseline reference text');
        break;
      case 'f_score':
        // F-score calculation using the same baseline
        results.f_score = calculateFScore(output, 'baseline reference text');
        break;
      case 'latency':
        // Mock latency calculation based on output complexity
        results.latency = calculateMockLatency(output);
        break;
    }
  }

  return results;
}

const jobsRouter = createRouter();

// POST /jobs - Create a new job
jobsRouter.post(
  '/', // ...existing code...

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        prompt,
        provider: providerName,
        model,
        temperature,
        topP,
        maxTokens,
        metrics: selectedMetrics,
      } = req.body;

      // Enhanced validation
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new ValidationError('prompt must be a non-empty string.');
      }

      if (!providerName || typeof providerName !== 'string') {
        throw new ValidationError('provider must be a non-empty string.');
      }

      if (!model || typeof model !== 'string') {
        throw new ValidationError('model must be a non-empty string.');
      }

      // Validate optional model parameters
      if (
        temperature !== undefined &&
        (typeof temperature !== 'number' || temperature < 0 || temperature > 2)
      ) {
        throw new ValidationError(
          'temperature must be a number between 0 and 2.',
        );
      }

      if (
        topP !== undefined &&
        (typeof topP !== 'number' || topP < 0 || topP > 1)
      ) {
        throw new ValidationError('topP must be a number between 0 and 1.');
      }

      if (
        maxTokens !== undefined &&
        (typeof maxTokens !== 'number' || maxTokens < 0)
      ) {
        throw new ValidationError('maxTokens must be a positive number.');
      }

      if (selectedMetrics !== undefined && !Array.isArray(selectedMetrics)) {
        throw new ValidationError('metrics must be an array of metric IDs.');
      }

      // Limit prompt length for security and cost control
      if (prompt.length > 50000) {
        throw new ValidationError(
          'prompt must be less than 50,000 characters.',
        );
      }

      const provider = getProvider(providerName);

      if (!provider) {
        throw new ValidationError(`Provider '${providerName}' not found.`);
      }
      if (!provider.models.includes(model)) {
        throw new ValidationError(
          `Model '${model}' not supported by provider '${providerName}'.`,
        );
      }

      if (providerName === 'openai' && !process.env.OPENAI_API_KEY) {
        throw new ServiceUnavailableError(
          'OpenAI API key is not configured on the server.',
        );
      }
      if (providerName === 'gemini' && !process.env.GEMINI_API_KEY) {
        throw new ServiceUnavailableError(
          'Gemini API key is not configured on the server.',
        );
      }

      // Build the job creation payload with optional parameters
      const jobData = {
        prompt,
        provider: providerName,
        model,
        ...(temperature !== undefined && { temperature }),
        ...(topP !== undefined && { topP }),
        ...(maxTokens !== undefined && { maxTokens }),
        ...(selectedMetrics !== undefined && { selectedMetrics }),
      };

      const job = await createJob(jobData);

      res.status(202).json(job);
    } catch (error) {
      next(error);
    }
  },
);

// GET /jobs - List jobs with optional filters
jobsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      limit = '20',
      offset = '0',
      provider,
      status,
      since,
    } = req.query as Record<string, string>;

    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('limit must be an integer between 1 and 100.');
    }

    const offsetNum = Number(offset);
    if (!Number.isInteger(offsetNum) || offsetNum < 0) {
      throw new ValidationError('offset must be a non-negative integer.');
    }

    const options: import('@prompt-lab/api').ListJobsOptions = {
      limit: limitNum,
      offset: offsetNum,
    };

    if (provider) {
      options.provider = provider;
    }
    if (status) {
      options.status = status as import('@prompt-lab/api').JobStatus;
    }
    if (since) {
      const date = new Date(since);
      if (!Number.isNaN(date.getTime())) {
        options.since = date;
      }
    }

    const results = await listJobs(options);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// GET /jobs/:id - Get job status
jobsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const job = await getJob(id);

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      res.json(job);
    } catch (error) {
      next(error);
    }
  },
);

// GET /jobs/:id/stream - Stream job results via SSE
jobsRouter.get(
  '/:id/stream',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const job = await getJob(id);

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      res.flushHeaders();

      const provider = getProvider(job.provider);
      if (!provider) {
        throw new Error(
          `Internal error: Provider '${job.provider}' not found for job ${id}`,
        );
      }

      await updateJob(id, { status: 'running' });
      const startTime = Date.now();

      const sendEvent = (data: object, event?: string) => {
        try {
          const jsonData = JSON.stringify(data);
          let sseString = '';
          if (event) {
            sseString += `event: ${event}\n`;
          }
          sseString += `data: ${jsonData}\n\n`;
          res.write(sseString);
          if (typeof res.flush === 'function') res.flush(); // Ensure immediate delivery
        } catch {
          // error intentionally ignored
        }
      };

      try {
        let output = '';
        let tokens = 0;
        let cost = 0;
        if (provider.stream) {
          const streamIterator = provider.stream(job.prompt, {
            model: job.model,
            ...(job.temperature !== null && { temperature: job.temperature }),
            ...(job.topP !== null && { topP: job.topP }),
            ...(job.maxTokens !== null && { maxTokens: job.maxTokens }),
          });
          try {
            while (true) {
              let result;
              try {
                result = await streamIterator.next();
              } catch (streamError) {
                const errorMessage =
                  streamError instanceof Error
                    ? streamError.message
                    : 'An unknown error occurred during streaming.';
                await updateJob(id, {
                  status: 'failed',
                  result: errorMessage,
                });
                sendEvent({ error: errorMessage }, 'error');
                sendEvent({ done: true }, 'done');
                if (!res.writableEnded) {
                  if (typeof res.flush === 'function') res.flush();
                  await new Promise((r) => setTimeout(r, 10));
                  if (!res.writableEnded) res.end();
                }
                return;
              }
              if (result.done) break;
              if (result.value && result.value.content) {
                output += result.value.content;
                sendEvent({ token: result.value.content });
              }
            }
            sendEvent({ done: true }, 'done');
            // Only send metrics if streaming completed without error
            const endTime = Date.now();
            tokens = Math.floor(output.length / 4);
            const pricePerK = 0.002;
            cost = (tokens / 1000) * pricePerK;

            // Calculate custom metrics based on selected metrics
            const customMetrics = calculateSelectedMetrics(
              output,
              job.selectedMetrics,
            );

            const metrics: import('@prompt-lab/api').JobMetrics = {
              totalTokens: tokens,
              avgCosSim: 0,
              meanLatencyMs: endTime - startTime,
              costUsd: cost,
              evaluationCases: 0,
              startTime,
              endTime,
              ...customMetrics, // Add the calculated custom metrics
            };
            await updateJob(id, {
              status: 'completed',
              result: output,
              metrics,
            });
            sendEvent(metrics, 'metrics');
            return;
          } catch (streamError) {
            // Defensive: should never reach here, but just in case
            const errorMessage =
              streamError instanceof Error
                ? streamError.message
                : 'An unknown error occurred during streaming.';
            await updateJob(id, {
              status: 'failed',
              result: errorMessage,
            });
            sendEvent({ error: errorMessage }, 'error');
            sendEvent({ done: true }, 'done');
            if (!res.writableEnded) {
              if (typeof res.flush === 'function') res.flush();
              await new Promise((r) => setTimeout(r, 10));
              if (!res.writableEnded) res.end();
            }
            return;
          }
        } else {
          // Fallback to non-streaming
          const result = await provider.complete(job.prompt, {
            model: job.model,
            ...(job.temperature !== null && { temperature: job.temperature }),
            ...(job.topP !== null && { topP: job.topP }),
            ...(job.maxTokens !== null && { maxTokens: job.maxTokens }),
          });
          output = result.output;
          tokens = result.tokens;
          cost = result.cost;
          sendEvent({ token: output });
          sendEvent({ done: true }, 'done');
        }

        const endTime = Date.now();

        // For streaming, we need to get final metrics from the completed job
        if (provider.stream) {
          // Try to estimate tokens for streaming (rough approximation)
          tokens = Math.floor(output.length / 4); // Rough token estimation
          const pricePerK = 0.002; // Default pricing, should be provider-specific
          cost = (tokens / 1000) * pricePerK;
        }

        const metrics: import('@prompt-lab/api').JobMetrics = {
          totalTokens: tokens,
          avgCosSim: 0, // Not applicable for streaming jobs
          meanLatencyMs: endTime - startTime,
          costUsd: cost,
          evaluationCases: 0, // Not applicable for streaming jobs
          startTime,
          endTime,
        };

        await updateJob(id, {
          status: 'completed',
          result: output,
          metrics,
        });
        sendEvent(metrics, 'metrics');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        await updateJob(id, {
          status: 'failed',
          result: errorMessage,
        });
        // Always use sendEvent for error event
        sendEvent({ error: errorMessage }, 'error');
        sendEvent({ done: true }, 'done');
      } finally {
        // Only end the response if not already ended
        if (!res.writableEnded) {
          res.end();
        }
      }
    } catch (error) {
      next(error);
    }
  },
);

// GET /jobs/:id/diff - Compare two jobs
jobsRouter.get(
  '/:id/diff',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { otherId } = req.query as { otherId?: string };

      // Get the base job
      const baseJob = await getJob(id);
      if (!baseJob) {
        throw new NotFoundError('Base job not found');
      }

      let compareJob: Job | undefined;

      if (otherId) {
        // Get the specific job to compare with
        compareJob = await getJob(otherId);
        if (!compareJob) {
          throw new NotFoundError('Compare job not found');
        }
      } else {
        // Get the previous job by creation time
        compareJob = await getPreviousJob(id);
        if (!compareJob) {
          throw new NotFoundError('No previous job found to compare with');
        }
      }

      res.json({ baseJob, compareJob });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /jobs/:id - Delete a job
jobsRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const deleted = await deleteJob(id);

      if (!deleted) {
        throw new NotFoundError('Job not found');
      }

      res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
      next(error);
    }
  },
);

export default jobsRouter as Router;
