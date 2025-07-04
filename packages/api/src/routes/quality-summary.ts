/**
 * Task 7 - /quality-summary Endpoint
 * SQL aggregation with in-code p95 calculation
 * Cache with node-cache, TTL from env
 */

import { Router, Request, Response } from 'express';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import NodeCache from 'node-cache';

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
    p95_latency_ms?: number; // Only if WITH_P95=true
  };
  timestamp: string;
}

// Configuration from environment
const SUMMARY_WINDOW_DAYS = parseInt(
  process.env.SUMMARY_WINDOW_DAYS || '7',
  10,
);
const SUMMARY_CACHE_TTL = parseInt(process.env.SUMMARY_CACHE_TTL || '30', 10); // seconds
const WITH_P95 = process.env.WITH_P95 === 'true';

// Cache instance
const cache = new NodeCache({ stdTTL: SUMMARY_CACHE_TTL });

/**
 * Calculate p95 latency from array of response times
 */
function calculateP95(responseTimes: number[]): number {
  if (responseTimes.length === 0) return 0;

  const sorted = [...responseTimes].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get quality summary for specified parameters
 */
export async function getQualitySummary(
  query: QualitySummaryQuery,
): Promise<QualitySummaryResponse> {
  const { model, since, until, windowDays = SUMMARY_WINDOW_DAYS } = query;

  // Calculate date range
  const endDate = until ? new Date(until) : new Date();
  const startDate = since
    ? new Date(since)
    : new Date(endDate.getTime() - windowDays * 24 * 60 * 60 * 1000);

  // Create cache key
  const cacheKey = `quality_summary_${model || 'all'}_${startDate.toISOString()}_${endDate.toISOString()}`;

  // Try to get from cache first
  if (cache) {
    const cached = cache.get<QualitySummaryResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Build query conditions
  const conditions = [
    gte(jobs.createdAt, startDate),
    lte(jobs.createdAt, endDate),
    eq(jobs.status, 'completed'),
  ];

  if (model) {
    conditions.push(eq(jobs.model, model));
  }

  // Main aggregation query (without response times for performance)
  const aggregateQuery = db
    .select({
      totalJobs: sql<number>`count(*)`,
      model: jobs.model,
      // Extract numeric metrics from JSON
      avgFleschScore: sql<number>`avg(json_extract(metrics, '$.flesch_reading_ease'))`,
      avgSentiment: sql<number>`avg(json_extract(metrics, '$.sentiment'))`,
      avgResponseTime: sql<number>`avg(json_extract(metrics, '$.response_time_ms'))`,
      successRate: sql<number>`count(*) * 1.0 / count(*)`, // All completed jobs are successful
    })
    .from(jobs)
    .where(and(...conditions))
    .groupBy(jobs.model);

  const results = await aggregateQuery;

  // If no results, return empty summary
  if (results.length === 0) {
    const summary: QualitySummaryResponse = {
      model: model || 'all',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: windowDays,
      },
      metrics: {
        totalJobs: 0,
        avgScore: 0,
        avgReadability: 0,
        avgSentiment: 0,
        successRate: 0,
      },
      timestamp: new Date().toISOString(),
    };

    return summary;
  }

  // Calculate p95 latency if requested
  let p95LatencyMs: number | undefined;

  if (WITH_P95) {
    const responseTimesQuery = db
      .select({
        responseTime: sql<number>`json_extract(metrics, '$.response_time_ms')`,
      })
      .from(jobs)
      .where(and(...conditions));

    const responseTimes = await responseTimesQuery;
    const validResponseTimes = responseTimes
      .map((r) => r.responseTime)
      .filter((rt) => rt != null && rt > 0);

    p95LatencyMs = calculateP95(validResponseTimes);
  }

  // Aggregate results across all models if no specific model requested
  const aggregatedResult = results.reduce(
    (acc, curr) => ({
      totalJobs: acc.totalJobs + curr.totalJobs,
      avgFleschScore: acc.avgFleschScore + (curr.avgFleschScore || 0),
      avgSentiment: acc.avgSentiment + (curr.avgSentiment || 0),
      avgResponseTime: acc.avgResponseTime + (curr.avgResponseTime || 0),
      modelCount: acc.modelCount + 1,
    }),
    {
      totalJobs: 0,
      avgFleschScore: 0,
      avgSentiment: 0,
      avgResponseTime: 0,
      modelCount: 0,
    },
  );

  const summary: QualitySummaryResponse = {
    model: model || 'all',
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      days: windowDays,
    },
    metrics: {
      totalJobs: aggregatedResult.totalJobs,
      avgScore:
        aggregatedResult.modelCount > 0
          ? (aggregatedResult.avgFleschScore + aggregatedResult.avgSentiment) /
            (2 * aggregatedResult.modelCount)
          : 0,
      avgReadability:
        aggregatedResult.modelCount > 0
          ? aggregatedResult.avgFleschScore / aggregatedResult.modelCount
          : 0,
      avgSentiment:
        aggregatedResult.modelCount > 0
          ? aggregatedResult.avgSentiment / aggregatedResult.modelCount
          : 0,
      successRate: 1.0, // All completed jobs are successful
      ...(p95LatencyMs !== undefined && { p95_latency_ms: p95LatencyMs }),
    },
    timestamp: new Date().toISOString(),
  };

  // Cache the result
  if (cache) {
    cache.set(cacheKey, summary);
  }

  return summary;
}

/**
 * Express route handler for quality summary
 */
export async function qualitySummaryHandler(req: Request, res: Response) {
  try {
    const query: QualitySummaryQuery = {
      model: req.query.model as string,
      since: req.query.since as string,
      until: req.query.until as string,
      windowDays: req.query.windowDays
        ? parseInt(req.query.windowDays as string, 10)
        : undefined,
    };

    // Validate date parameters
    if (query.since && isNaN(new Date(query.since).getTime())) {
      return res.status(400).json({
        error: 'Invalid since date format',
        code: 400,
      });
    }

    if (query.until && isNaN(new Date(query.until).getTime())) {
      return res.status(400).json({
        error: 'Invalid until date format',
        code: 400,
      });
    }

    if (query.windowDays && (isNaN(query.windowDays) || query.windowDays < 1)) {
      return res.status(400).json({
        error: 'windowDays must be a positive number',
        code: 400,
      });
    }

    const summary = await getQualitySummary(query);

    res.json({
      success: true,
      data: summary,
      cached: cache
        ? cache.has(
            `quality_summary_${query.model || 'all'}_${summary.period.start}_${summary.period.end}`,
          )
        : false,
    });
  } catch (error) {
    console.error('Quality summary error:', error);
    res.status(500).json({
      error: 'Internal server error while generating quality summary',
      code: 500,
    });
  }
}

/**
 * Initialize cache when node-cache becomes available
 */
export function initializeCache() {
  try {
    console.log(
      'Quality summary cache initialized with TTL:',
      SUMMARY_CACHE_TTL,
    );
  } catch (error) {
    console.warn('Failed to initialize cache, running without caching:', error);
  }
}

/**
 * Create router with quality summary routes
 */
export function createQualitySummaryRouter(): Router {
  const router = Router();

  router.get('/quality-summary', qualitySummaryHandler);

  return router;
}
