import type { Request, Response, NextFunction, Router } from 'express';
import { Router as createRouter } from 'express';
import { getProvider, createJob, getJob, updateJob } from '@prompt-lab/api';
import {
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
} from '../errors/ApiError.js';

const jobsRouter = createRouter();

// POST /jobs - Create a new job
jobsRouter.post(
  '/',

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt, provider: providerName, model } = req.body;

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

      const job = await createJob({
        prompt,
        provider: providerName,
        model,
      });

      res.status(202).json(job);
    } catch (error) {
      next(error);
    }
  },
);

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
      res.flushHeaders();

      const provider = getProvider(job.provider);
      if (!provider) {
        throw new Error(
          `Internal error: Provider '${job.provider}' not found for job ${id}`,
        );
      }

      await updateJob(id, { status: 'running' });

      const startTime = Date.now();
      let fullResponse = '';

      const sendEvent = (data: object, event?: string) => {
        if (event) {
          res.write(`event: ${event}\n`);
        }
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const stream = provider.complete(job.prompt, { model: job.model });

        for await (const token of stream) {
          fullResponse += token;
          sendEvent({ token });
        }

        const endTime = Date.now();
        const metrics: import('@prompt-lab/api').JobMetrics = {
          totalTokens: fullResponse.split(/\s+/).filter(Boolean).length,
          avgCosSim: 0, // Not applicable for streaming jobs
          meanLatencyMs: endTime - startTime,
          costUSD: 0, // To be calculated based on actual usage
          evaluationCases: 0, // Not applicable for streaming jobs
          startTime,
          endTime,
        };

        await updateJob(id, {
          status: 'completed',
          result: fullResponse,
          metrics,
        });
        sendEvent(metrics, 'metrics');
      } catch (error) {
        console.error(`Job ${id} failed:`, error);
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred.';

        await updateJob(id, {
          status: 'failed',
          result: errorMessage,
        });
        sendEvent({ error: errorMessage }, 'error');
      } finally {
        res.end();
      }
    } catch (error) {
      next(error);
    }
  },
);

export default jobsRouter as Router;
