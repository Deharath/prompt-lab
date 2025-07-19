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

      // Import the listJobs function and database utilities
      const { listJobs } = await import('@prompt-lab/evaluation-engine');

      // Calculate the date threshold
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysNum);

      // Get all jobs in the time period
      const allJobs = await listJobs({
        since: dateThreshold,
        limit: 1000, // Large limit to get all jobs in period
        offset: 0,
      });

      // Calculate basic statistics
      const totalJobs = allJobs.length;
      const completedJobs = allJobs.filter(
        (job) => job.status === 'completed',
      ).length;
      const failedJobs = allJobs.filter(
        (job) => job.status === 'failed',
      ).length;

      // Calculate total cost
      const totalCost = allJobs.reduce(
        (sum, job) => sum + (job.costUsd || 0),
        0,
      );

      // Provider breakdown
      const providerBreakdown = allJobs.reduce(
        (acc, job) => {
          acc[job.provider] = (acc[job.provider] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Model breakdown
      const modelBreakdown = allJobs.reduce(
        (acc, job) => {
          acc[job.model] = (acc[job.model] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // For now, use placeholder values for complex metrics
      // In a real implementation, these would be calculated from job metrics
      const averageResponseTime = 1500; // ms
      const recentTrends = {
        jobsToday: allJobs.filter((job) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return job.createdAt >= today;
        }).length,
        costTrend: totalCost > 0 ? 'increasing' : 'stable',
        averageSuccessRate:
          totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      };

      res.json({
        totalJobs,
        completedJobs,
        failedJobs,
        averageResponseTime,
        totalCost,
        providerBreakdown,
        modelBreakdown,
        recentTrends,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /dashboard/recent - Get recent jobs with pagination and filtering
dashboardRouter.get(
  '/recent',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        limit = '10',
        provider,
        status,
      } = req.query as Record<string, string>;

      // Validate the limit parameter
      const limitNum = Number(limit);
      if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new ValidationError(
          "Invalid 'limit' parameter. Must be an integer between 1 and 100.",
        );
      }

      // Import the listJobs function
      const { listJobs } = await import('@prompt-lab/evaluation-engine');

      // Build options for listJobs
      const options: {
        limit: number;
        offset: number;
        provider?: string;
        status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
      } = {
        limit: limitNum,
        offset: 0,
      };

      if (provider) {
        options.provider = provider;
      }

      if (status) {
        const validStatuses = [
          'pending',
          'running',
          'completed',
          'failed',
          'cancelled',
        ];
        if (validStatuses.includes(status)) {
          options.status = status as
            | 'pending'
            | 'running'
            | 'completed'
            | 'failed'
            | 'cancelled';
        }
      }

      // Get recent jobs using the service
      const recentJobs = await listJobs(options);

      res.json(recentJobs);
    } catch (error) {
      next(error);
    }
  },
);

export default dashboardRouter as Router;
