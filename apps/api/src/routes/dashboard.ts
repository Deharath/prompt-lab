import type { Request, Response, NextFunction, Router } from 'express';
import { Router as createRouter } from 'express';
import { db, getDb } from '@prompt-lab/api';
import { jobs } from '@prompt-lab/api';
import { gte, sql } from 'drizzle-orm';
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

      // Query for score history - group by day and calculate average score
      const scoreHistoryQuery = await db
        .select({
          date: sql<string>`DATE(${jobs.createdAt}, 'unixepoch')`.as('date'),
          avgScore: sql<number>`AVG(
            CASE 
              WHEN json_extract(${jobs.metrics}, '$.avgScore') IS NOT NULL 
              THEN json_extract(${jobs.metrics}, '$.avgScore')
              ELSE NULL
            END
          )`.as('avgScore'),
        })
        .from(jobs)
        .where(gte(jobs.createdAt, dateThreshold))
        .groupBy(sql`DATE(${jobs.createdAt}, 'unixepoch')`)
        .orderBy(sql`DATE(${jobs.createdAt}, 'unixepoch')`);

      // Query for cost by model - group by model and sum cost
      const costByModelQuery = await db
        .select({
          model: jobs.model,
          totalCost: sql<number>`SUM(COALESCE(${jobs.costUsd}, 0))`.as(
            'totalCost',
          ),
        })
        .from(jobs)
        .where(gte(jobs.createdAt, dateThreshold))
        .groupBy(jobs.model)
        .orderBy(jobs.model);

      // Format the response
      const scoreHistory = scoreHistoryQuery.map((row) => ({
        date: row.date,
        avgScore: row.avgScore || 0,
      }));

      const costByModel = costByModelQuery.map((row) => ({
        model: row.model,
        totalCost: row.totalCost || 0,
      }));

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
