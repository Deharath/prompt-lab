import type { Request, Response, NextFunction, Router } from 'express';
import { Router as createRouter } from 'express';
import { db, getDb } from '@prompt-lab/api';
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

      await getDb(); // Ensure database is initialized

      // Calculate the date threshold
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysNum);
      const dateThresholdUnix = Math.floor(dateThreshold.getTime() / 1000);

      // Access the underlying SQLite instance through the Drizzle client
      if (
        !db ||
        typeof db !== 'object' ||
        !('_' in db) ||
        typeof db._ !== 'object' ||
        !('session' in db._) ||
        typeof db._.session !== 'object' ||
        db._.session === null ||
        !('client' in db._.session)
      ) {
        throw new Error('Database client is not available');
      }
      const sqlite = db._.session.client as {
        prepare: (sql: string) => { all: (param: unknown) => unknown[] };
      };

      // Create prepared statements for better performance and to get actual results
      const scoreHistoryStmt = sqlite.prepare(`
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

      const costByModelStmt = sqlite.prepare(`
        SELECT 
          model,
          SUM(COALESCE(cost_usd, 0)) as totalCost
        FROM jobs 
        WHERE created_at >= ?
        GROUP BY model
        ORDER BY model
      `);

      // Execute queries
      const scoreHistoryQuery = scoreHistoryStmt.all(dateThresholdUnix);
      const costByModelQuery = costByModelStmt.all(dateThresholdUnix);

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
            avgScore: (row as { avgScore: number }).avgScore || 0,
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
            totalCost: (row as { totalCost: number }).totalCost || 0,
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
