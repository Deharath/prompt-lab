/**
 * Task 7 - /quality-summary Endpoint
 * SQL aggregation with in-code p95 calculation
 * Cache with node-cache, TTL from env
 */

import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { getDb } from '@prompt-lab/api';
import { ValidationError } from '../errors/ApiError.js';
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
  const cached = cache.get<QualitySummaryResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get database instance
  const dbInstance = await getDb();
  if (!dbInstance) {
    throw new Error('Database initialization failed');
  }

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  // Access the underlying SQLite instance through the same pattern as dashboard
  let sqlite: {
    prepare: (sql: string) => { all: (param: unknown) => unknown[] };
  };

  try {
    // The database instance should have exec and run methods attached in index.ts
    const dbRaw = dbInstance as unknown;

    if (!dbRaw || typeof (dbRaw as { exec?: unknown }).exec !== 'function') {
      throw new Error('Database raw methods are not available');
    }

    // Create a prepare function using the raw database instance
    sqlite = {
      prepare: (sql: string) => {
        // Access the internal SQLite instance through Drizzle's internal structure
        const internalDb =
          (
            dbRaw as {
              session?: { client?: unknown };
              _?: { session?: { client?: unknown } };
            }
          )?.session?.client ||
          (dbRaw as { _?: { session?: { client?: unknown } } })?._?.session
            ?.client;
        if (
          !internalDb ||
          typeof (internalDb as { prepare?: unknown }).prepare !== 'function'
        ) {
          throw new Error('Internal SQLite client not accessible');
        }
        return (
          internalDb as {
            prepare: (sql: string) => {
              all: (param: unknown) => unknown[];
            };
          }
        ).prepare(sql);
      },
    };
  } catch (clientError) {
    throw new Error(
      `Database client is not available: ${clientError instanceof Error ? clientError.message : 'Unknown error'}`,
    );
  }

  // Build SQL query for basic aggregation
  let sql = `
    SELECT 
      COUNT(*) as totalJobs,
      COALESCE(model, 'unknown') as model,
      AVG(CAST(json_extract(metrics, '$.flesch_reading_ease') AS REAL)) as avgFleschScore,
      AVG(CAST(json_extract(metrics, '$.sentiment') AS REAL)) as avgSentiment,
      AVG(CAST(json_extract(metrics, '$.response_time_ms') AS REAL)) as avgResponseTime,
      COUNT(*) * 1.0 / COUNT(*) as successRate
    FROM jobs 
    WHERE created_at >= ? 
      AND created_at <= ? 
      AND status = 'completed'
  `;

  const params: unknown[] = [startTimestamp, endTimestamp];

  if (model) {
    sql += ' AND model = ?';
    params.push(model);
  }

  sql += ' GROUP BY model';

  const aggregateStmt = sqlite.prepare(sql);
  const results = aggregateStmt.all(params) as Array<{
    totalJobs: number;
    model: string;
    avgFleschScore: number | null;
    avgSentiment: number | null;
    avgResponseTime: number | null;
    successRate: number;
  }>;

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

    cache.set(cacheKey, summary);
    return summary;
  }

  // Calculate p95 latency if requested
  let p95LatencyMs: number | undefined;

  if (WITH_P95) {
    let p95Sql = `
      SELECT json_extract(metrics, '$.response_time_ms') as responseTime
      FROM jobs 
      WHERE created_at >= ? 
        AND created_at <= ? 
        AND status = 'completed'
        AND json_extract(metrics, '$.response_time_ms') IS NOT NULL
    `;

    const p95Params: unknown[] = [startTimestamp, endTimestamp];

    if (model) {
      p95Sql += ' AND model = ?';
      p95Params.push(model);
    }

    const p95Stmt = sqlite.prepare(p95Sql);
    const responseTimeResults = p95Stmt.all(p95Params) as Array<{
      responseTime: number;
    }>;

    const responseTimes = responseTimeResults
      .map((r) => r.responseTime)
      .filter((rt) => rt != null && rt > 0);

    p95LatencyMs = calculateP95(responseTimes);
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
  cache.set(cacheKey, summary);

  return summary;
}

const qualitySummaryRouter = Router();

// GET /quality-summary - Get quality summary statistics
qualitySummaryRouter.get(
  '/quality-summary',
  async (req: Request, res: Response, next: NextFunction) => {
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
        throw new ValidationError('Invalid since date format');
      }

      if (query.until && isNaN(new Date(query.until).getTime())) {
        throw new ValidationError('Invalid until date format');
      }

      if (
        query.windowDays &&
        (isNaN(query.windowDays) || query.windowDays < 1)
      ) {
        throw new ValidationError('windowDays must be a positive number');
      }

      const summary = await getQualitySummary(query);

      res.json({
        success: true,
        data: summary,
        cached: cache.has(
          `quality_summary_${query.model || 'all'}_${summary.period.start}_${summary.period.end}`,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Initialize cache
 */
export function initializeCache() {
  console.log('Quality summary cache initialized with TTL:', SUMMARY_CACHE_TTL);
}

export default qualitySummaryRouter;
