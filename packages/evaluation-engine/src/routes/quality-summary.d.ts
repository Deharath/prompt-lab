/**
 * Task 7 - /quality-summary Endpoint
 * SQL aggregation with in-code p95 calculation
 * Cache with node-cache, TTL from env
 */
import { Router, Request, Response } from 'express';
export interface QualitySummaryQuery {
  model?: string;
  since?: string;
  until?: string;
  windowDays?: number;
}
export interface QualitySummaryResponse {
  model: string;
  period: {
    start: string;
    end: string;
    days: number;
  };
  metrics: {
    totalJobs: number;
    avgScore: number;
    avgReadability: number;
    avgSentiment: number;
    successRate: number;
    p95_latency_ms?: number;
  };
  timestamp: string;
}
/**
 * Get quality summary for specified parameters
 */
export declare function getQualitySummary(
  query: QualitySummaryQuery,
): Promise<QualitySummaryResponse>;
/**
 * Express route handler for quality summary
 */
export declare function qualitySummaryHandler(
  req: Request,
  res: Response,
): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Initialize cache when node-cache becomes available
 */
export declare function initializeCache(): void;
/**
 * Create router with quality summary routes
 */
export declare function createQualitySummaryRouter(): Router;
declare const _default: Router;
export default _default;
