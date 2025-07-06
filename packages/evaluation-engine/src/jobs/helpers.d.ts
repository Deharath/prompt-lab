import type { JobMetrics, JobStatus } from '../types/index.js';
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
export declare function calculateAverageScore(metrics: JobMetrics): number;
export declare function withAverageScore(
  metrics: JobMetrics,
): JobMetricsWithAvg;
export declare function usageFromMetrics(metrics: JobMetrics): {
  tokensUsed: number;
  costUsd: number;
};
export declare function logStatusChange(
  job: Job,
  status: JobStatus | undefined,
  errorMessage?: string,
  logger?: {
    error: (
      message: string,
      context?: import('../utils/logger.js').LogContext,
      error?: Error,
    ) => void;
    warn: (
      message: string,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
    info: (
      message: string,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
    debug: (
      message: string,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
    request: (
      method: string,
      path: string,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
    response: (
      method: string,
      path: string,
      statusCode: number,
      duration: number,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
    jobCreated: (
      jobId: string,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
    jobStarted: (
      jobId: string,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
    jobCompleted: (
      jobId: string,
      duration: number,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
    jobFailed: (
      jobId: string,
      error: Error,
      context?: import('../utils/logger.js').LogContext,
    ) => void;
  },
): void;
export declare function getGeminiTokenCount(result: {
  response: {
    usageMetadata?: GeminiUsageStats;
  };
}): number;
