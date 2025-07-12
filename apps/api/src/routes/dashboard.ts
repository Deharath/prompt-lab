import type { Request, Response, NextFunction, Router } from 'express';
import { Router as createRouter } from 'express';
import { getDb } from '@prompt-lab/evaluation-engine';
import { ValidationError } from '../errors/ApiError.js';

const dashboardRouter = createRouter();

// GET /dashboard/stats - Get aggregated dashboard statistics
dashboardRouter.get(
  '/stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { days = '30' } = req.query as Record<string, string>;

      // Validate the days parameter
      const daysNum = Number(days);
      if (!Number.isInteger(daysNum) || daysNum < 1) {
        throw new ValidationError(
          "Invalid 'days' parameter. Must be a positive integer.",
        );
      }

      // Ensure database is initialized and available
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new Error('Database initialization failed');
      }

      // Calculate the date threshold
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysNum);
      const dateThresholdUnix = Math.floor(dateThreshold.getTime() / 1000);

      // Access the underlying SQLite instance through the attached raw methods
      let sqlite: {
        prepare: (sql: string) => { all: (param: unknown) => unknown[] };
      };

      try {
        // The database instance should have exec and run methods attached in index.ts
        const dbRaw = dbInstance as unknown;

        if (
          !dbRaw ||
          typeof (dbRaw as { exec?: unknown }).exec !== 'function'
        ) {
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
              typeof (internalDb as { prepare?: unknown }).prepare !==
                'function'
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

      let scoreHistoryStmt,
        costByModelStmt,
        tokensByModelStmt,
        estimatedCostByModelStmt,
        modelEfficiencyStmt;
      try {
        scoreHistoryStmt = sqlite.prepare(`
          SELECT 
            DATE(created_at, 'unixepoch') as date,
            AVG(
              CASE 
                WHEN json_extract(metrics, '$.flesch_reading_ease') IS NOT NULL 
                THEN json_extract(metrics, '$.flesch_reading_ease')
                ELSE NULL
              END
            ) as avgReadability,
            COUNT(*) as totalJobs
          FROM jobs 
          WHERE created_at >= ?
          GROUP BY DATE(created_at, 'unixepoch')
          ORDER BY DATE(created_at, 'unixepoch')
        `);

        costByModelStmt = sqlite.prepare(`
          SELECT 
            model,
            SUM(COALESCE(cost_usd, 0)) as totalCost
          FROM jobs 
          WHERE created_at >= ?
          GROUP BY model
          ORDER BY model
        `);

        tokensByModelStmt = sqlite.prepare(`
          SELECT 
            model,
            SUM(COALESCE(tokens_used, 0)) as totalTokens
          FROM jobs 
          WHERE created_at >= ?
          GROUP BY model
          ORDER BY model
        `);

        estimatedCostByModelStmt = sqlite.prepare(`
          SELECT 
            model,
            SUM(COALESCE(cost_usd, 0)) as estimatedCost
          FROM jobs 
          WHERE created_at >= ?
          GROUP BY model
          ORDER BY model
        `);

        modelEfficiencyStmt = sqlite.prepare(`
          SELECT 
            model,
            AVG(
              CASE 
                WHEN json_extract(metrics, '$.response_time_ms') IS NOT NULL 
                THEN json_extract(metrics, '$.response_time_ms')
                ELSE NULL
              END
            ) as avgResponseTime,
            CASE 
              WHEN SUM(COALESCE(tokens_used, 0)) > 0 
              THEN SUM(COALESCE(cost_usd, 0)) / SUM(COALESCE(tokens_used, 0))
              ELSE 0
            END as costPerToken,
            COUNT(*) as totalJobs
          FROM jobs 
          WHERE created_at >= ? AND status = 'completed'
          GROUP BY model
          HAVING COUNT(*) > 0
          ORDER BY model
        `);
      } catch (prepareError) {
        throw new Error(
          `Failed to prepare database statements: ${prepareError instanceof Error ? prepareError.message : 'Unknown error'}`,
        );
      }

      // Execute queries with error handling
      let scoreHistoryQuery,
        costByModelQuery,
        tokensByModelQuery,
        estimatedCostByModelQuery,
        modelEfficiencyQuery;
      try {
        scoreHistoryQuery = scoreHistoryStmt.all(dateThresholdUnix);
        costByModelQuery = costByModelStmt.all(dateThresholdUnix);
        tokensByModelQuery = tokensByModelStmt.all(dateThresholdUnix);
        estimatedCostByModelQuery =
          estimatedCostByModelStmt.all(dateThresholdUnix);
        modelEfficiencyQuery = modelEfficiencyStmt.all(dateThresholdUnix);
      } catch (queryError) {
        throw new Error(
          `Failed to execute dashboard queries: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`,
        );
      }

      // Format the response
      const scoreHistory = scoreHistoryQuery.map((row: unknown) => {
        if (
          typeof row === 'object' &&
          row !== null &&
          'date' in row &&
          'avgReadability' in row &&
          'totalJobs' in row
        ) {
          return {
            date: (row as { date: string }).date,
            avgReadability:
              typeof (row as { avgReadability: unknown }).avgReadability ===
              'number'
                ? (row as { avgReadability: number }).avgReadability
                : 0,
            totalJobs:
              typeof (row as { totalJobs: unknown }).totalJobs === 'number'
                ? (row as { totalJobs: number }).totalJobs
                : 0,
          };
        }
        return { date: '', avgReadability: 0, totalJobs: 0 };
      });

      const costByModel = costByModelQuery.map((row: unknown) => {
        if (
          typeof row === 'object' &&
          row !== null &&
          'model' in row &&
          'totalCost' in row
        ) {
          return {
            model: (row as { model: string }).model,
            totalCost:
              typeof (row as { totalCost: unknown }).totalCost === 'number'
                ? (row as { totalCost: number }).totalCost
                : 0,
          };
        }
        return { model: '', totalCost: 0 };
      });

      const tokensByModel = tokensByModelQuery.map((row: unknown) => {
        if (
          typeof row === 'object' &&
          row !== null &&
          'model' in row &&
          'totalTokens' in row
        ) {
          return {
            model: (row as { model: string }).model,
            totalTokens:
              typeof (row as { totalTokens: unknown }).totalTokens === 'number'
                ? (row as { totalTokens: number }).totalTokens
                : 0,
          };
        }
        return { model: '', totalTokens: 0 };
      });

      const estimatedCostByModel = estimatedCostByModelQuery.map(
        (row: unknown) => {
          if (
            typeof row === 'object' &&
            row !== null &&
            'model' in row &&
            'estimatedCost' in row
          ) {
            return {
              model: (row as { model: string }).model,
              estimatedCost:
                typeof (row as { estimatedCost: unknown }).estimatedCost ===
                'number'
                  ? (row as { estimatedCost: number }).estimatedCost
                  : 0,
            };
          }
          return { model: '', estimatedCost: 0 };
        },
      );

      const modelEfficiency = modelEfficiencyQuery.map((row: unknown) => {
        if (
          typeof row === 'object' &&
          row !== null &&
          'model' in row &&
          'avgResponseTime' in row &&
          'costPerToken' in row &&
          'totalJobs' in row
        ) {
          return {
            model: (row as { model: string }).model,
            avgResponseTime:
              typeof (row as { avgResponseTime: unknown }).avgResponseTime ===
              'number'
                ? (row as { avgResponseTime: number }).avgResponseTime
                : 0,
            costPerToken:
              typeof (row as { costPerToken: unknown }).costPerToken ===
              'number'
                ? (row as { costPerToken: number }).costPerToken
                : 0,
            totalJobs:
              typeof (row as { totalJobs: unknown }).totalJobs === 'number'
                ? (row as { totalJobs: number }).totalJobs
                : 0,
          };
        }
        return { model: '', avgResponseTime: 0, costPerToken: 0, totalJobs: 0 };
      });

      res.json({
        scoreHistory,
        costByModel,
        tokensByModel,
        estimatedCostByModel,
        modelEfficiency,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default dashboardRouter as Router;
