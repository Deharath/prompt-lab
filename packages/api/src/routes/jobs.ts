import { Router } from 'express';
import { getProvider } from '../providers';
import * as JobService from '../jobs/service';

const jobsRouter = Router();

// POST /jobs - Create a new job
jobsRouter.post('/', async (req, res, next) => {
  try {
    const { prompt, provider: providerName, model } = req.body;

    if (!prompt || typeof prompt !== 'string' || !providerName || typeof providerName !== 'string' || !model || typeof model !== 'string') {
      return res.status(400).json({ error: 'Request body must include non-empty string fields: prompt, provider, model.' });
    }

    const provider = getProvider(providerName);

    if (!provider) {
      return res.status(400).json({ error: `Provider '${providerName}' not found.` });
    }
    if (!provider.models.includes(model)) {
      return res.status(400).json({ error: `Model '${model}' not supported by provider '${providerName}'.` });
    }

    if (providerName === 'openai' && !process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API key is not configured on the server.' });
    }
    if (providerName === 'gemini' && !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
    }

    const job = await JobService.createJob({
      prompt,
      provider: providerName,
      model,
    });

    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
});

// GET /jobs/:id/stream - Stream job results via SSE
jobsRouter.get('/:id/stream', async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await JobService.getJob(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const provider = getProvider(job.provider);
    if (!provider) {
      throw new Error(`Internal error: Provider '${job.provider}' not found for job ${id}`);
    }

    await JobService.updateJob(id, { status: 'running' });

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
      const metrics = {
        durationMs: endTime - startTime,
        tokenCount: fullResponse.split(/\s+/).filter(Boolean).length,
      };

      await JobService.updateJob(id, { status: 'completed', result: fullResponse, metrics });
      sendEvent(metrics, 'metrics');
    } catch (error) {
      console.error(`Job ${id} failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

      await JobService.updateJob(id, { status: 'failed', result: errorMessage });
      sendEvent({ error: errorMessage }, 'error');
    } finally {
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

export default jobsRouter;
