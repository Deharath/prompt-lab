import type { JobMetrics, JobStatus } from '../types/index.js';
import { log } from '../utils/logger.js';
import type { Job } from '../db/schema.js';

export interface GeminiUsageStats {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  cachedContentTokenCount?: number;
}

export interface JobMetricsWithAvg extends JobMetrics {
  avgScore: number;
}

export function calculateAverageScore(metrics: JobMetrics): number {
  const numericValues = Object.values(metrics).filter(
    (v): v is number => typeof v === 'number',
  );
  if (numericValues.length === 0) {
    return 0;
  }
  const sum = numericValues.reduce((a, b) => a + b, 0);
  return sum / numericValues.length;
}

export function withAverageScore(metrics: JobMetrics): JobMetricsWithAvg {
  return { ...metrics, avgScore: calculateAverageScore(metrics) };
}

export function usageFromMetrics(metrics: JobMetrics) {
  return {
    tokensUsed: metrics.totalTokens,
    costUsd: metrics.costUSD,
  };
}

export function logStatusChange(
  job: Job,
  status: JobStatus | undefined,
  errorMessage?: string,
  logger = log,
) {
  if (!status) return;
  if (status === 'completed') {
    const duration = job.updatedAt.getTime() - job.createdAt.getTime();
    logger.jobCompleted(job.id, duration, {
      provider: job.provider,
      model: job.model,
    });
  } else if (status === 'failed') {
    logger.jobFailed(job.id, new Error(errorMessage || 'Unknown error'), {
      provider: job.provider,
      model: job.model,
    });
  } else if (status === 'running') {
    logger.jobStarted(job.id, { provider: job.provider, model: job.model });
  }
}

export function getGeminiTokenCount(result: {
  response: { usageMetadata?: GeminiUsageStats };
}): number {
  return result.response.usageMetadata?.totalTokenCount ?? 0;
}
