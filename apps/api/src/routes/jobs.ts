import type { Request, Response, NextFunction, Router } from 'express';
import { Router as createRouter } from 'express';
import * as os from 'os';

/**
 * Memory cleanup utility for post-job execution
 * Forces garbage collection if memory growth was significant
 */
function cleanupJobMemory(jobId: string, baselineMemoryMB: number): void {
  const currentMemoryMB = process.memoryUsage().rss / 1024 / 1024;
  const memoryGrowthMB = currentMemoryMB - baselineMemoryMB;

  // Memory growth logged by service layer

  // Force garbage collection if available and growth was significant
  if (global.gc && memoryGrowthMB > 50) {
    // GC forced due to memory growth - logged by service layer
    global.gc();

    const afterGcMemoryMB = process.memoryUsage().rss / 1024 / 1024;
    const freedMemoryMB = currentMemoryMB - afterGcMemoryMB;
    // GC memory freed - logged by service layer
  }
}
import {
  createJob,
  getJob,
  updateJob,
  listJobs,
  getPreviousJob,
  getProvider,
  deleteJob,
  retryJob,
  updateJobWithError,
  type Job,
} from '@prompt-lab/evaluation-engine';
import { db as _db, jobs as jobsTable } from '@prompt-lab/evaluation-engine';
import { eq as drEq } from 'drizzle-orm';
import { WebSocketJobManager } from '../lib/websocketManager.js';
import { jobEvents } from '../lib/jobEvents.js';
import {
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
} from '../errors/ApiError.js';

// Import NEW metric calculation system
import {
  calculateMetrics,
  MetricRegistry,
  type MetricInput,
} from '@prompt-lab/evaluation-engine';
import {
  transitionJobState,
  incrementJobState,
  decrementJobState,
  type JobState,
} from '../lib/prometheus.js';

// Simple in-memory cache for metrics results
const metricsCache = new Map<
  string,
  { result: Record<string, unknown>; timestamp: number }
>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Generate cache key from output and metrics configuration
function generateCacheKey(output: string, metrics: MetricInput[]): string {
  const outputHash = output.substring(0, 100) + output.length; // Simple hash
  const metricsKey = metrics
    .map((m) => `${m.id}:${m.input || ''}`)
    .sort()
    .join('|');
  return `${outputHash}:${metricsKey}`;
}

// Clean expired cache entries
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of metricsCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      metricsCache.delete(key);
    }
  }
}

/**
 * Get all available metrics based on system memory constraints
 * Disables memory-intensive metrics on low-memory systems (< 2GB RAM)
 */
function getDefaultMetrics(): MetricInput[] {
  const totalSystemMemoryGB = os.totalmem() / 1024 ** 3;
  const isLowMemorySystem = totalSystemMemoryGB < 2;

  try {
    // Get ALL metrics from registry and filter by memory requirements
    const allMetrics = MetricRegistry.getAll()
      .filter((plugin) => {
        // Filter out memory-intensive metrics on low-memory systems
        if (
          isLowMemorySystem &&
          plugin.requiresMemory &&
          plugin.requiresMemory > 100
        ) {
          return false;
        }
        return true;
      })
      .map((plugin) => ({ id: plugin.id }));

    // Memory management metrics loading - logged by service layer

    return allMetrics;
  } catch (error) {
    // Fallback metrics warning - logged by service layer

    // Fallback to hard-coded defaults if registry isn't available
    const fallbackMetrics: MetricInput[] = [
      { id: 'flesch_reading_ease' },
      { id: 'word_count' },
      { id: 'sentence_count' },
      { id: 'vocab_diversity' },
    ];

    if (!isLowMemorySystem) {
      fallbackMetrics.push({ id: 'sentiment' });
    }

    return fallbackMetrics;
  }
}

// Helper function to calculate metrics with new upgraded system
async function calculateJobMetrics(
  output: string,
  selectedMetrics?: unknown,
  jobContext?: { prompt?: string; inputData?: unknown; template?: string },
  userDisabledMetrics?: string[],
): Promise<Record<string, unknown>> {
  if (!output || typeof output !== 'string') {
    return {};
  }

  // Use selected metrics if provided, otherwise fall back to defaults for better performance
  let metrics: MetricInput[];

  if (
    selectedMetrics &&
    Array.isArray(selectedMetrics) &&
    selectedMetrics.length > 0
  ) {
    // Use the selected metrics from the job
    metrics = selectedMetrics as MetricInput[];
  } else {
    // Use ALL available metrics (not just defaults) for comprehensive evaluation
    const allMetrics = MetricRegistry.getAll()
      .filter((plugin) => {
        // Filter out memory-intensive metrics on low-memory systems
        const totalSystemMemoryGB = os.totalmem() / 1024 ** 3;
        const isLowMemorySystem = totalSystemMemoryGB < 2;

        if (
          isLowMemorySystem &&
          plugin.requiresMemory &&
          plugin.requiresMemory > 100
        ) {
          return false;
        }

        return true;
      })
      .map((plugin) => ({ id: plugin.id }));

    metrics = allMetrics;
  }

  // For precision, recall, f_score, BLEU, and ROUGE: if no explicit input provided, use job context as reference
  if (jobContext) {
    [
      'precision',
      'recall',
      'f_score',
      'bleu_score',
      'rouge_1',
      'rouge_2',
      'rouge_l',
    ].forEach((metricId) => {
      const metric = metrics.find((m) => m.id === metricId);
      if (metric && !metric.input) {
        // Build reference text from input data (the article/content to summarize)
        let referenceText = '';

        // Primary source: inputData (the actual content being processed)
        if (jobContext.inputData) {
          if (typeof jobContext.inputData === 'string') {
            referenceText = jobContext.inputData;
          } else if (typeof jobContext.inputData === 'object') {
            referenceText = JSON.stringify(jobContext.inputData);
          }
        }

        // Fallback: use prompt if no inputData
        if (!referenceText && jobContext.prompt) {
          referenceText = jobContext.prompt;
        }

        // Set the reference text for comparison
        if (referenceText.trim()) {
          metric.input = referenceText.trim();
        }
      }
    });
  }

  // Check cache first for performance improvement
  const cacheKey = generateCacheKey(output, metrics);
  const cachedEntry = metricsCache.get(cacheKey);

  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    return cachedEntry.result;
  }

  // Combine system-level disabled metrics with user-disabled metrics
  const systemDisabledMetrics = getDisabledMetricsForSystem();
  const allDisabledMetrics = new Set([
    ...systemDisabledMetrics,
    ...(userDisabledMetrics || []),
  ]);

  // Calculate metrics if not cached
  const result = await calculateMetrics(output, metrics, allDisabledMetrics);

  // Cache the result for future use
  metricsCache.set(cacheKey, {
    result: result.results,
    timestamp: Date.now(),
  });

  // Periodic cache cleanup (every 10 calculations)
  if (metricsCache.size % 10 === 0) {
    cleanupCache();
  }

  return result.results;
}

/**
 * Get set of metrics to disable based on system memory constraints and environment config
 */
function getDisabledMetricsForSystem(): Set<string> {
  const totalSystemMemoryGB = os.totalmem() / 1024 ** 3;
  const isLowMemorySystem = totalSystemMemoryGB < 2;

  const disabledMetrics = new Set<string>();

  // Check environment variables for explicit sentiment analysis disabling
  const sentimentExplicitlyDisabled =
    process.env.DISABLE_SENTIMENT_ANALYSIS === 'true' ||
    process.env.ENABLE_ML_MODELS === 'false';

  if (isLowMemorySystem || sentimentExplicitlyDisabled) {
    disabledMetrics.add('sentiment');
    disabledMetrics.add('sentiment_detailed');

    if (isLowMemorySystem) {
      // Sentiment analysis disabled due to memory constraints - logged by service layer
    }

    if (sentimentExplicitlyDisabled) {
      // Sentiment analysis disabled via environment - logged by service layer
    }
  }

  return disabledMetrics;
}

// Map to track active jobs and their cancellation functions
const activeJobCancellations = new Map<string, () => void>();

const jobsRouter = createRouter();

// POST /jobs - Create a new job
jobsRouter.post(
  '/', // ...existing code...

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        prompt,
        template,
        inputData,
        provider: providerName,
        model,
        temperature,
        topP,
        maxTokens,
        metrics: selectedMetrics,
        disabledMetrics,
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
      if (providerName === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
        throw new ServiceUnavailableError(
          'Anthropic API key is not configured on the server.',
        );
      }

      // Build the job creation payload with optional parameters
      const jobData = {
        prompt,
        ...(template && { template }),
        ...(inputData && { inputData }),
        provider: providerName,
        model,
        ...(temperature !== undefined && { temperature }),
        ...(topP !== undefined && { topP }),
        ...(maxTokens !== undefined && { maxTokens }),
        ...(selectedMetrics !== undefined && { selectedMetrics }),
        ...(disabledMetrics !== undefined && { disabledMetrics }),
      };

      const job = await createJob(jobData);

      // Metrics: newly created jobs are pending
      incrementJobState('pending');

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

    const options: import('@prompt-lab/evaluation-engine').ListJobsOptions = {
      limit: limitNum,
      offset: offsetNum,
    };

    if (provider) {
      options.provider = provider;
    }
    if (status) {
      options.status =
        status as import('@prompt-lab/evaluation-engine').JobStatus;
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

      // Prevent streaming if job is already completed, failed, or cancelled
      if (['completed', 'failed', 'cancelled'].includes(job.status as any)) {
        res.status(200).json({
          status: job.status,
          result: job.result,
          metrics: job.metrics,
          ...((job.status as any) === 'cancelled' && {
            message: 'Job was cancelled',
          }),
        });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      // Rely on global CORS middleware; avoid overriding with wildcard here
      res.flushHeaders();

      const workerEnabled =
        String(process.env.WORKER_ENABLED).toLowerCase() === 'true';
      const provider = workerEnabled ? null : getProvider(job.provider);
      if (!workerEnabled) {
        if (!provider) {
          throw new Error(
            `Internal error: Provider '${job.provider}' not found for job ${id}`,
          );
        }
      }

      // Track if client disconnected and job cancellation
      let clientDisconnected = false;
      let jobCancelled = false;
      let metricsPending = false; // Background metrics calculation in progress
      const abortController = new AbortController();

      const cleanup = () => {
        clientDisconnected = true;
        abortController.abort();
      };

      const cancelJob = () => {
        jobCancelled = true;
        abortController.abort();
      };

      // Register the cancellation function for this job
      activeJobCancellations.set(id, cancelJob);

      // Handle client disconnect
      req.on('close', cleanup);
      req.on('aborted', cleanup);
      res.on('close', cleanup);

      if (!workerEnabled) {
        await updateJob(id, { status: 'running' });
        // Metrics: transition pending -> running
        transitionJobState('pending', 'running');
      }
      const startTime = Date.now();

      // PROPER memory management: measure growth from baseline, not absolute usage
      const baselineMemoryMB = process.memoryUsage().rss / 1024 / 1024;
      const totalSystemMemoryGB = os.totalmem() / 1024 ** 3;

      // Dynamic memory growth limits based on system capabilities
      const memoryGrowthLimitMB =
        totalSystemMemoryGB < 2
          ? Math.floor(totalSystemMemoryGB * 1024 * 0.6) // 60% of total for small VPS (e.g., 600MB on 1GB system)
          : 2048; // 2GB growth allowance for development machines (16GB+)

      // Memory management baseline - logged by service layer

      // Memory check: Only fail if THIS JOB grows memory excessively
      const memoryCheck = () => {
        const currentMemoryMB = process.memoryUsage().rss / 1024 / 1024;
        const memoryGrowthMB = currentMemoryMB - baselineMemoryMB;

        if (memoryGrowthMB > memoryGrowthLimitMB) {
          // Memory limit exceeded warning - logged by service layer
          return false;
        }

        // Log significant growth for monitoring (but don't fail)
        if (memoryGrowthMB > 100) {
          // Memory growth monitoring - logged by service layer
        }

        return true;
      };

      const sendEvent = (data: object, event?: string) => {
        if (clientDisconnected || res.writableEnded) {
          return false;
        }
        try {
          const jsonData = JSON.stringify(data);
          let sseString = '';
          if (event) {
            sseString += `event: ${event}\n`;
          }
          sseString += `data: ${jsonData}\n\n`;
          res.write(sseString);
          if (typeof res.flush === 'function') res.flush();
          return true;
        } catch {
          clientDisconnected = true;
          return false;
        }
      };

      try {
        let output = '';
        let tokens = 0;
        let cost = 0;
        if (!workerEnabled) {
          const p: any = provider!;
          if (p && typeof p.stream === 'function') {
            const streamIterator = p.stream(job.prompt, {
              model: job.model,
              requestId: (req as any).requestId,
              ...(job.temperature !== null && { temperature: job.temperature }),
              ...(job.topP !== null && { topP: job.topP }),
              ...(job.maxTokens !== null && { maxTokens: job.maxTokens }),
            } as any);
            try {
              while (true) {
                // Check for client disconnect and memory usage before processing
                if (clientDisconnected) {
                  await updateJob(id, {
                    status: 'failed',
                    result: '',
                    errorMessage: 'Client disconnected during streaming',
                  });
                  cleanupJobMemory(id, baselineMemoryMB);
                  return;
                }

                // Check if job was cancelled (more frequent checks)
                if (jobCancelled || abortController.signal.aborted) {
                  // Save the partial output that was generated before cancellation
                  if (output.length > 0) {
                    await updateJob(id, {
                      status: 'cancelled' as any,
                      result: output,
                      errorMessage: 'Job cancelled by user',
                    });
                  }
                  // Metrics: transition running -> cancelled
                  transitionJobState('running', 'cancelled');
                  cleanupJobMemory(id, baselineMemoryMB);
                  if (!clientDisconnected) {
                    sendEvent({ message: 'Job was cancelled' }, 'cancelled');
                    sendEvent({ done: true }, 'done');
                  }
                  if (!res.writableEnded) {
                    res.end();
                  }
                  return;
                }

                // Periodic database check for cancellation (every 10 iterations)
                if (tokens % 10 === 0) {
                  const currentJob = await getJob(id);
                  if (currentJob?.status === 'cancelled') {
                    cancelJob();
                    continue; // Will be caught by the check above
                  }
                }

                if (!memoryCheck()) {
                  await updateJob(id, {
                    status: 'failed',
                    result: '',
                    errorMessage: 'Job aborted due to memory constraints',
                  });
                  // Metrics: transition running -> failed
                  transitionJobState('running', 'failed');
                  cleanupJobMemory(id, baselineMemoryMB);
                  if (!clientDisconnected) {
                    sendEvent(
                      { error: 'Job aborted due to memory constraints' },
                      'job-error',
                    );
                    sendEvent({ done: true }, 'done');
                  }
                  if (!res.writableEnded) {
                    res.end();
                  }
                  return;
                }

                let result;
                try {
                  result = await streamIterator.next();
                } catch (streamError) {
                  await updateJobWithError(id, streamError);
                  // Metrics: transition running -> failed
                  transitionJobState('running', 'failed');
                  cleanupJobMemory(id, baselineMemoryMB);
                  const errorMessage =
                    streamError instanceof Error
                      ? streamError.message
                      : 'An unknown error occurred during streaming.';
                  if (!clientDisconnected) {
                    sendEvent({ error: errorMessage }, 'job-error');
                    sendEvent({ done: true }, 'done');
                  }
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
                  if (!sendEvent({ token: result.value.content })) {
                    // Client disconnected while sending
                    await updateJob(id, {
                      status: 'failed',
                      result: '',
                      errorMessage: 'Client disconnected during streaming',
                    });
                    // Metrics: transition running -> failed
                    transitionJobState('running', 'failed');
                    cleanupJobMemory(id, baselineMemoryMB);
                    return;
                  }
                }
              }

              // Check one more time before finalizing
              if (clientDisconnected) {
                await updateJob(id, {
                  status: 'failed',
                  result: '',
                  errorMessage: 'Client disconnected before completion',
                });
                // Metrics: transition running -> failed
                transitionJobState('running', 'failed');
                cleanupJobMemory(id, baselineMemoryMB);
                return;
              }

              // Streaming is complete: mark completed quickly and calculate metrics in background
              const endTime = Date.now();
              tokens = Math.floor(output.length / 4);
              const pricePerK = 0.002;
              cost = (tokens / 1000) * pricePerK;

              await updateJob(id, { status: 'completed', result: output });
              transitionJobState('running', 'completed');
              sendEvent({ status: 'completed' }, 'status');
              if (!clientDisconnected) {
                sendEvent({ done: true }, 'done');
              }

              metricsPending = true;
              setImmediate(async () => {
                try {
                  const customMetrics = await calculateJobMetrics(
                    output,
                    job.selectedMetrics,
                    {
                      prompt: job.prompt,
                      inputData: job.inputData,
                      template: job.template || undefined,
                    },
                    (job.disabledMetrics as string[]) || [],
                  );
                  const metrics: import('@prompt-lab/evaluation-engine').JobMetrics =
                    {
                      ...customMetrics,
                      response_time_ms: endTime - startTime,
                      ...(cost > 0 && { estimated_cost_usd: cost }),
                    };
                  await updateJob(id, { metrics });
                  if (!clientDisconnected) {
                    sendEvent(metrics, 'metrics');
                  }
                } catch (bgErr) {
                  const msg =
                    bgErr instanceof Error ? bgErr.message : String(bgErr);
                  if (!clientDisconnected) {
                    sendEvent({ error: msg }, 'job-error');
                  }
                } finally {
                  metricsPending = false;
                  // Clean up memory and then end the response
                  cleanupJobMemory(id, baselineMemoryMB);
                  if (!res.writableEnded && !clientDisconnected) {
                    res.end();
                  }
                }
              });
              return;
            } catch (streamError) {
              // Defensive: should never reach here, but just in case
              const errorMessage =
                streamError instanceof Error
                  ? streamError.message
                  : 'An unknown error occurred during streaming.';
              await updateJob(id, {
                status: 'failed',
                result: '',
                errorMessage,
              });
              sendEvent({ status: 'failed' }, 'status');
              cleanupJobMemory(id, baselineMemoryMB);
              if (!clientDisconnected) {
                sendEvent({ error: errorMessage }, 'job-error');
                sendEvent({ done: true }, 'done');
              }
              if (!res.writableEnded) {
                if (typeof res.flush === 'function') res.flush();
                await new Promise((r) => setTimeout(r, 10));
                if (!res.writableEnded) res.end();
              }
              return;
            }
          } else {
            // Fallback to non-streaming
            const result = await p.complete(job.prompt, {
              model: job.model,
              requestId: (req as any).requestId,
              ...(job.temperature !== null && { temperature: job.temperature }),
              ...(job.topP !== null && { topP: job.topP }),
              ...(job.maxTokens !== null && { maxTokens: job.maxTokens }),
            } as any);
            output = result.output;
            tokens = result.tokens;
            cost = result.cost;

            if (!clientDisconnected) {
              sendEvent({ token: output });
            }

            const endTime = Date.now();

            // Mark completed and notify quickly
            await updateJob(id, {
              status: 'completed',
              result: output,
            });
            transitionJobState('running', 'completed');
            sendEvent({ status: 'completed' }, 'status');
            if (!clientDisconnected) {
              sendEvent({ done: true }, 'done');
            }

            // Background metrics calculation
            metricsPending = true;
            setImmediate(async () => {
              try {
                const customMetrics = await calculateJobMetrics(
                  output,
                  job.selectedMetrics,
                  {
                    prompt: job.prompt,
                    inputData: job.inputData,
                    template: job.template || undefined,
                  },
                  (job.disabledMetrics as string[]) || [],
                );
                const metrics: import('@prompt-lab/evaluation-engine').JobMetrics =
                  {
                    ...customMetrics,
                    response_time_ms: endTime - startTime,
                    ...(cost > 0 && { estimated_cost_usd: cost }),
                  };
                await updateJob(id, { metrics });
                if (!clientDisconnected) {
                  sendEvent(metrics, 'metrics');
                }
              } catch (bgErr) {
                const msg =
                  bgErr instanceof Error ? bgErr.message : String(bgErr);
                if (!clientDisconnected) {
                  sendEvent({ error: msg }, 'job-error');
                }
              } finally {
                metricsPending = false;
                // Clean up memory after successful completion (non-streaming)
                cleanupJobMemory(id, baselineMemoryMB);
                if (!res.writableEnded && !clientDisconnected) {
                  res.end();
                }
              }
            });
          }
        } else {
          // Worker-enabled path: subscribe to events and stream them through SSE
          const unsubscribe = jobEvents.subscribe(id, (evt) => {
            if (clientDisconnected || res.writableEnded) return;
            switch (evt.type) {
              case 'token':
                sendEvent({ token: evt.content });
                break;
              case 'status':
                sendEvent({ status: evt.status }, 'status');
                break;
              case 'metrics':
                sendEvent(evt.payload, 'metrics');
                break;
              case 'error':
                sendEvent({ error: evt.message }, 'job-error');
                break;
              case 'done':
                sendEvent({ done: true }, 'done');
                if (!res.writableEnded) res.end();
                break;
            }
          });
          // Ensure unsubscribe on close
          const cleanupSub = () => unsubscribe();
          req.on('close', cleanupSub);
          res.on('close', cleanupSub);
          return; // Worker will drive the rest
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        await updateJob(id, {
          status: 'failed',
          result: '',
          errorMessage,
        });
        // Metrics: transition running -> failed
        transitionJobState('running', 'failed');
        sendEvent({ status: 'failed' }, 'status');
        cleanupJobMemory(id, baselineMemoryMB);
        // Always use sendEvent for error event
        if (!clientDisconnected) {
          sendEvent({ error: errorMessage }, 'job-error');
          sendEvent({ done: true }, 'done');
        }
      } finally {
        // Clean up the cancellation function
        activeJobCancellations.delete(id);

        // Only end the response if not already ended and no background metrics
        if (!metricsPending && !res.writableEnded && !clientDisconnected) {
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

      // Fetch job first to get its last-known status for gauge decrement
      const job = await getJob(id);
      if (!job) {
        throw new NotFoundError('Job not found');
      }

      const deleted = await deleteJob(id);
      if (!deleted) {
        throw new NotFoundError('Job not found');
      }

      // Decrement gauge for the job's terminal state
      const state: JobState | null = ((): JobState | null => {
        const s = job.status as string;
        const mapped = s === 'evaluating' ? 'running' : s;
        const allowed: JobState[] = [
          'pending',
          'running',
          'completed',
          'failed',
          'cancelled',
        ];
        return (allowed as string[]).includes(mapped)
          ? (mapped as JobState)
          : null;
      })();
      if (state) {
        decrementJobState(state);
      }

      res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
      next(error);
    }
  },
);

// PUT /jobs/:id/cancel - Cancel a running job
jobsRouter.put(
  '/:id/cancel',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const job = await getJob(id);
      if (!job) {
        throw new NotFoundError('Job not found');
      }

      // Only allow cancellation of pending or running jobs
      if (!['pending', 'running', 'evaluating'].includes(job.status)) {
        return res.status(400).json({
          error: `Cannot cancel job with status '${job.status}'`,
        });
      }

      // Update job status to cancelled
      const cancelledJob = await updateJob(id, {
        status: 'cancelled' as any, // Type assertion until schema migration
        errorMessage: 'Job cancelled by user',
      });

      // Mark cancelRequested so worker honors it
      try {
        await (_db as any)
          .update(jobsTable as any)
          .set({ cancelRequested: 1 } as any)
          .where(drEq((jobsTable as any).id, id));
      } catch (_e) {
        void _e;
      }

      // Metrics: transition from previous state to cancelled
      if (job.status === 'pending') {
        transitionJobState('pending', 'cancelled');
      } else if (job.status === 'running' || job.status === 'evaluating') {
        transitionJobState('running', 'cancelled');
      }

      // Immediately cancel the active job if it's streaming
      const cancelFunction = activeJobCancellations.get(id);
      if (cancelFunction) {
        cancelFunction();
      }
      // For worker-enabled mode, mark cancelRequested as well
      try {
        await _db
          .update(jobsTable)
          .set({ cancelRequested: 1 as any })
          .where(drEq(jobsTable.id, id));
      } catch (_e) {
        void _e;
      }

      // Notify WebSocket connections about cancellation
      WebSocketJobManager.getInstance().notifyJobCancelled(id);

      res.json({
        message: 'Job cancelled successfully',
        job: cancelledJob,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /jobs/:id/retry - Retry a failed job
jobsRouter.post(
  '/:id/retry',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const newJob = await retryJob(id);

      if (!newJob) {
        throw new NotFoundError('Job not found');
      }

      res.status(201).json({
        message: 'Job retry created successfully',
        originalJobId: id,
        newJob,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default jobsRouter as Router;
