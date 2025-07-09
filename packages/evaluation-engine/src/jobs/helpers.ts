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
  // Calculate average score from meaningful numeric metrics only
  const numericMetrics: number[] = [];

  // Include only our valuable metrics in the average
  if (typeof metrics.flesch_reading_ease === 'number') {
    numericMetrics.push(metrics.flesch_reading_ease / 100); // Normalize to 0-1
  }
  if (typeof metrics.sentiment === 'number') {
    numericMetrics.push((metrics.sentiment + 1) / 2); // Convert -1 to 1 range to 0-1
  }
  if (typeof metrics.precision === 'number') {
    numericMetrics.push(metrics.precision);
  }
  if (typeof metrics.recall === 'number') {
    numericMetrics.push(metrics.recall);
  }
  if (typeof metrics.f_score === 'number') {
    numericMetrics.push(metrics.f_score);
  }

  if (numericMetrics.length === 0) {
    return 0;
  }

  const sum = numericMetrics.reduce((a, b) => a + b, 0);
  return sum / numericMetrics.length;
}

export function withAverageScore(metrics: JobMetrics): JobMetricsWithAvg {
  return { ...metrics, avgScore: calculateAverageScore(metrics) };
}

export function usageFromMetrics(metrics: JobMetrics) {
  return {
    tokensUsed: metrics.word_count || 0, // Use word count as a proxy for token usage
    costUsd: metrics.estimated_cost_usd || 0,
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
    const error = new Error(
      errorMessage || 'Job failed with no error message provided',
    );
    logger.jobFailed(job.id, error, {
      provider: job.provider,
      model: job.model,
      originalError: errorMessage,
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
