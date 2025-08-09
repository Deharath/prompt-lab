import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { eq, and, isNull } from 'drizzle-orm';
import {
  db,
  jobs,
  getJob,
  updateJob,
  getProvider,
  updateJobWithError,
} from '@prompt-lab/evaluation-engine';
import { jobEvents } from '../lib/jobEvents.js';
import { transitionJobState } from '../lib/prometheus.js';
import {
  MetricRegistry,
  calculateMetrics,
} from '@prompt-lab/evaluation-engine';
import * as osmod from 'node:os';

const WORKER_ID = `${os.hostname()}-${process.pid}-${randomUUID().slice(0, 6)}`;

async function claimNextPendingJob() {
  // Select one pending, unclaimed job
  const j: any = jobs;
  const rows = await db
    .select({ id: j.id })
    .from(jobs)
    .where(and(eq(j.status, 'pending' as any), isNull(j.claimedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  // Attempt to claim by setting claimedAt+workerId and moving to running
  const now = new Date();
  const updated = await db
    .update(jobs as any)
    .set({
      claimedAt: now as any,
      workerId: WORKER_ID as any,
      status: 'running' as any,
    } as any)
    .where(
      and(
        eq(j.id, row.id),
        isNull(j.claimedAt),
        eq(j.status, 'pending' as any),
      ),
    )
    .returning({ id: j.id });
  return updated[0]?.id ?? null;
}

export async function runJobsWorker({ enabled }: { enabled: boolean }) {
  if (!enabled) return;
  // Simple loop; could be improved with notifiers later
  const loop = async () => {
    try {
      const jobId = await claimNextPendingJob();
      if (jobId) {
        // Transition metrics pending->running was handled by route before; do it here as well
        transitionJobState('pending', 'running');
        await executeJob(jobId);
      }
    } catch (e) {
      // Swallow to keep loop alive
    } finally {
      setTimeout(loop, 200);
    }
  };
  loop();
}

async function executeJob(jobId: string) {
  const job = await getJob(jobId);
  if (!job) return;
  const provider = getProvider(job.provider);
  if (!provider) {
    await updateJob(jobId, {
      status: 'failed' as any,
      errorMessage: `Provider '${job.provider}' not found`,
    });
    jobEvents.publish(jobId, {
      type: 'error',
      message: 'Internal provider error',
    });
    jobEvents.publish(jobId, { type: 'done' });
    transitionJobState('running', 'failed');
    return;
  }

  const startTime = Date.now();
  let output = '';
  try {
    if (provider.stream) {
      const streamIterator = provider.stream(job.prompt, {
        model: job.model,
        ...(job.temperature !== null && { temperature: job.temperature }),
        ...(job.topP !== null && { topP: job.topP }),
        ...(job.maxTokens !== null && { maxTokens: job.maxTokens }),
      } as any);

      while (true) {
        // Check DB cancel flag periodically
        if (output.length % 200 === 0) {
          const current = await getJob(jobId);
          if (
            current?.status === 'cancelled' ||
            (current as any)?.cancelRequested === 1
          ) {
            await updateJob(jobId, {
              status: 'cancelled' as any,
              result: output,
              errorMessage: 'Job cancelled by user',
            });
            jobEvents.publish(jobId, { type: 'status', status: 'cancelled' });
            jobEvents.publish(jobId, { type: 'done' });
            transitionJobState('running', 'cancelled');
            return;
          }
        }
        const r = await streamIterator.next();
        if (r.done) break;
        if (r.value?.content) {
          output += r.value.content;
          jobEvents.publish(jobId, { type: 'token', content: r.value.content });
        }
      }
    } else {
      const result = await provider.complete(job.prompt, {
        model: job.model,
        ...(job.temperature !== null && { temperature: job.temperature }),
        ...(job.topP !== null && { topP: job.topP }),
        ...(job.maxTokens !== null && { maxTokens: job.maxTokens }),
      } as any);
      output = result.output;
      jobEvents.publish(jobId, { type: 'token', content: output });
    }

    // Mark completion quickly and notify listeners
    await updateJob(jobId, { status: 'completed' as any, result: output });
    jobEvents.publish(jobId, { type: 'status', status: 'completed' });
    jobEvents.publish(jobId, { type: 'done' });
    transitionJobState('running', 'completed');

    // Metrics backgrounding: compute asynchronously, persist, and emit SSE event
    setImmediate(async () => {
      try {
        const totalSystemMemoryGB = osmod.totalmem() / 1024 ** 3;
        const isLowMemorySystem = totalSystemMemoryGB < 2;
        const allMetrics = MetricRegistry.getAll()
          .filter((plugin) =>
            isLowMemorySystem &&
            plugin.requiresMemory &&
            plugin.requiresMemory > 100
              ? false
              : true,
          )
          .map((plugin) => ({ id: plugin.id }));
        const result = await calculateMetrics(output, allMetrics, new Set());
        const metrics = {
          ...result.results,
          response_time_ms: Date.now() - startTime,
        } as Record<string, unknown>;
        await updateJob(jobId, { metrics: metrics as any });
        jobEvents.publish(jobId, { type: 'metrics', payload: metrics });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        jobEvents.publish(jobId, { type: 'error', message: msg });
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateJobWithError(jobId, err);
    jobEvents.publish(jobId, { type: 'error', message: msg });
    jobEvents.publish(jobId, { type: 'done' });
    transitionJobState('running', 'failed');
  }
}
