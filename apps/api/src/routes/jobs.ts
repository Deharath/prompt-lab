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

  console.log(
    `[Memory Cleanup] Job ${jobId}: Growth=+${memoryGrowthMB.toFixed(0)}MB, Final=${currentMemoryMB.toFixed(0)}MB`,
  );

  // Force garbage collection if available and growth was significant
  if (global.gc && memoryGrowthMB > 50) {
    console.log(
      `[Memory Cleanup] Job ${jobId}: Forcing GC due to ${memoryGrowthMB.toFixed(0)}MB growth`,
    );
    global.gc();

    const afterGcMemoryMB = process.memoryUsage().rss / 1024 / 1024;
    const freedMemoryMB = currentMemoryMB - afterGcMemoryMB;
    console.log(
      `[Memory Cleanup] Job ${jobId}: GC freed ${freedMemoryMB.toFixed(0)}MB (${afterGcMemoryMB.toFixed(0)}MB remaining)`,
    );
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
  type Job,
} from '@prompt-lab/evaluation-engine';
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

/**
 * Get default metrics based on system memory constraints
 * Disables sentiment analysis on low-memory systems (< 2GB RAM)
 */
function getDefaultMetrics(): MetricInput[] {
  const totalSystemMemoryGB = os.totalmem() / 1024 ** 3;
  const isLowMemorySystem = totalSystemMemoryGB < 2;

  try {
    // Get defaults from registry and filter by memory requirements
    const defaultMetrics = MetricRegistry.getDefaults()
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

    console.log(
      `[Memory Management] System RAM: ${totalSystemMemoryGB.toFixed(1)}GB, Loaded ${defaultMetrics.length} default metrics`,
    );

    return defaultMetrics;
  } catch (error) {
    console.warn(
      'Failed to load default metrics from registry, using fallback:',
      error,
    );

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
): Promise<Record<string, unknown>> {
  if (!output || typeof output !== 'string') {
    return {};
  }

  // Always run all available metrics instead of selected ones
  const allAvailableMetrics = MetricRegistry.getAll()
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

  // Use all available metrics instead of just defaults
  let allMetrics = allAvailableMetrics;

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
      const metric = allMetrics.find((m) => m.id === metricId);
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

  const result = await calculateMetrics(
    output,
    allMetrics,
    getDisabledMetricsForSystem(),
  );
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
      console.log(
        `[Memory Management] Disabled sentiment analysis on ${totalSystemMemoryGB.toFixed(1)}GB system`,
      );
    }

    if (sentimentExplicitlyDisabled) {
      console.log(
        `[Environment Config] Sentiment analysis disabled via environment variables`,
      );
    }
  }

  return disabledMetrics;
}

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

      // Prevent streaming if job is already completed or failed
      if (job.status === 'completed' || job.status === 'failed') {
        res.status(200).json({
          status: job.status,
          result: job.result,
          metrics: job.metrics,
        });
        return;
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

      // Track if client disconnected
      let clientDisconnected = false;
      const cleanup = () => {
        clientDisconnected = true;
      };

      // Handle client disconnect
      req.on('close', cleanup);
      req.on('aborted', cleanup);
      res.on('close', cleanup);

      await updateJob(id, { status: 'running' });
      const startTime = Date.now();

      // PROPER memory management: measure growth from baseline, not absolute usage
      const baselineMemoryMB = process.memoryUsage().rss / 1024 / 1024;
      const totalSystemMemoryGB = os.totalmem() / 1024 ** 3;

      // Dynamic memory growth limits based on system capabilities
      const memoryGrowthLimitMB =
        totalSystemMemoryGB < 2
          ? Math.floor(totalSystemMemoryGB * 1024 * 0.6) // 60% of total for small VPS (e.g., 600MB on 1GB system)
          : 2048; // 2GB growth allowance for development machines (16GB+)

      console.log(
        `[Memory Management] Job ${id}: Baseline=${baselineMemoryMB.toFixed(0)}MB, Growth_Limit=${memoryGrowthLimitMB}MB, System_Total=${totalSystemMemoryGB.toFixed(1)}GB`,
      );

      // Memory check: Only fail if THIS JOB grows memory excessively
      const memoryCheck = () => {
        const currentMemoryMB = process.memoryUsage().rss / 1024 / 1024;
        const memoryGrowthMB = currentMemoryMB - baselineMemoryMB;

        if (memoryGrowthMB > memoryGrowthLimitMB) {
          console.warn(
            `[Memory Management] ⚠️ Job ${id} exceeded growth limit: +${memoryGrowthMB.toFixed(0)}MB > ${memoryGrowthLimitMB}MB (Current: ${currentMemoryMB.toFixed(0)}MB, Baseline: ${baselineMemoryMB.toFixed(0)}MB)`,
          );
          return false;
        }

        // Log significant growth for monitoring (but don't fail)
        if (memoryGrowthMB > 100) {
          console.log(
            `[Memory Management] Job ${id} growth: +${memoryGrowthMB.toFixed(0)}MB (Current: ${currentMemoryMB.toFixed(0)}MB)`,
          );
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
        if (provider.stream) {
          const streamIterator = provider.stream(job.prompt, {
            model: job.model,
            ...(job.temperature !== null && { temperature: job.temperature }),
            ...(job.topP !== null && { topP: job.topP }),
            ...(job.maxTokens !== null && { maxTokens: job.maxTokens }),
          });
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

              if (!memoryCheck()) {
                await updateJob(id, {
                  status: 'failed',
                  result: '',
                  errorMessage: 'Job aborted due to memory constraints',
                });
                cleanupJobMemory(id, baselineMemoryMB);
                if (!clientDisconnected) {
                  sendEvent(
                    { error: 'Job aborted due to memory constraints' },
                    'error',
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
                const errorMessage =
                  streamError instanceof Error
                    ? streamError.message
                    : 'An unknown error occurred during streaming.';
                await updateJob(id, {
                  status: 'failed',
                  result: '',
                  errorMessage,
                });
                cleanupJobMemory(id, baselineMemoryMB);
                if (!clientDisconnected) {
                  sendEvent({ error: errorMessage }, 'error');
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
              cleanupJobMemory(id, baselineMemoryMB);
              return;
            }

            // Streaming is complete, transition to evaluating state
            await updateJob(id, { status: 'evaluating' });

            // Don't send 'done' event yet - calculate metrics first
            const endTime = Date.now();
            tokens = Math.floor(output.length / 4);
            const pricePerK = 0.002;
            cost = (tokens / 1000) * pricePerK;

            // Calculate metrics including defaults
            const customMetrics = await calculateJobMetrics(
              output,
              job.selectedMetrics,
              {
                prompt: job.prompt,
                inputData: job.inputData,
                template: job.template || undefined,
              },
            );

            // Only include meaningful metrics - remove obsolete ones
            const metrics: import('@prompt-lab/evaluation-engine').JobMetrics =
              {
                ...customMetrics, // Our valuable metrics from metrics.ts
                response_time_ms: endTime - startTime,
                // Only include cost if it's actually valuable for the use case
                ...(cost > 0 && { estimated_cost_usd: cost }),
              };

            // Update database with final result and metrics
            await updateJob(id, {
              status: 'completed',
              result: output,
              metrics,
            });

            // Send metrics first, then done event
            if (!clientDisconnected) {
              sendEvent(metrics, 'metrics');
              sendEvent({ done: true }, 'done');
            }

            // Clean up memory after successful completion
            cleanupJobMemory(id, baselineMemoryMB);
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
            cleanupJobMemory(id, baselineMemoryMB);
            if (!clientDisconnected) {
              sendEvent({ error: errorMessage }, 'error');
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
          const result = await provider.complete(job.prompt, {
            model: job.model,
            ...(job.temperature !== null && { temperature: job.temperature }),
            ...(job.topP !== null && { topP: job.topP }),
            ...(job.maxTokens !== null && { maxTokens: job.maxTokens }),
          });
          output = result.output;
          tokens = result.tokens;
          cost = result.cost;

          if (!clientDisconnected) {
            sendEvent({ token: output });
            sendEvent({ done: true }, 'done');
          }

          const endTime = Date.now();

          // Calculate metrics for non-streaming responses
          const customMetrics = await calculateJobMetrics(
            output,
            job.selectedMetrics,
            {
              prompt: job.prompt,
              inputData: job.inputData,
              template: job.template || undefined,
            },
          );

          const metrics: import('@prompt-lab/evaluation-engine').JobMetrics = {
            ...customMetrics, // Our valuable metrics from metrics.ts
            response_time_ms: endTime - startTime,
            // Only include cost if it's actually valuable for the use case
            ...(cost > 0 && { estimated_cost_usd: cost }),
          };

          await updateJob(id, {
            status: 'completed',
            result: output,
            metrics,
          });

          if (!clientDisconnected) {
            sendEvent(metrics, 'metrics');
          }

          // Clean up memory after successful completion (non-streaming)
          cleanupJobMemory(id, baselineMemoryMB);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        await updateJob(id, {
          status: 'failed',
          result: '',
          errorMessage,
        });
        cleanupJobMemory(id, baselineMemoryMB);
        // Always use sendEvent for error event
        if (!clientDisconnected) {
          sendEvent({ error: errorMessage }, 'error');
          sendEvent({ done: true }, 'done');
        }
      } finally {
        // Only end the response if not already ended
        if (!res.writableEnded && !clientDisconnected) {
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
