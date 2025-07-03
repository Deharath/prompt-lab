import type { Request, Response, NextFunction, Router } from 'express';
import { Router as createRouter } from 'express';
import { getDb } from '@prompt-lab/api';
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

      // Create prepared statements for better performance and to get actual results
      let scoreHistoryStmt, costByModelStmt;
      try {
        scoreHistoryStmt = sqlite.prepare(`
          SELECT 
            DATE(created_at, 'unixepoch') as date,
            AVG(
              CASE 
                WHEN json_extract(metrics, '$.avgScore') IS NOT NULL 
                THEN json_extract(metrics, '$.avgScore')
                ELSE NULL
              END
            ) as avgScore
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
      } catch (prepareError) {
        throw new Error(
          `Failed to prepare database statements: ${prepareError instanceof Error ? prepareError.message : 'Unknown error'}`,
        );
      }

      // Execute queries with error handling
      let scoreHistoryQuery, costByModelQuery;
      try {
        scoreHistoryQuery = scoreHistoryStmt.all(dateThresholdUnix);
        costByModelQuery = costByModelStmt.all(dateThresholdUnix);
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
          'avgScore' in row
        ) {
          return {
            date: (row as { date: string }).date,
            avgScore:
              typeof (row as { avgScore: unknown }).avgScore === 'number'
                ? (row as { avgScore: number }).avgScore
                : 0,
          };
        }
        return { date: '', avgScore: 0 };
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

      res.json({
        scoreHistory,
        costByModel,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default dashboardRouter as Router;
