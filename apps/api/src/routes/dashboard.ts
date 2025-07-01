import { Router } from 'express';
import { getDb, db, jobs } from '@prompt-lab/api';
import { gt } from 'drizzle-orm';

const router = Router();

router.get('/stats', async (req, res, next) => {
  try {
    let { days } = req.query as { days?: string };
    if (days === undefined) {
      days = '30';
    }
    const daysNum = Number(days);
    if (!Number.isInteger(daysNum) || daysNum <= 0) {
      return res.status(400).json({
        error: "Invalid 'days' parameter. Must be a positive integer.",
      });
    }

    await getDb();
    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    const rows = await db
      .select({
        createdAt: jobs.createdAt,
        model: jobs.model,
        costUsd: jobs.costUsd,
        metrics: jobs.metrics,
      })
      .from(jobs)
      .where(gt(jobs.createdAt, since));

    const scoreMap = new Map<string, { sum: number; count: number }>();
    const costMap = new Map<string, number>();

    for (const row of rows) {
      const dateKey = row.createdAt.toISOString().slice(0, 10);
      const metrics = row.metrics as { avgScore?: number } | null;
      if (metrics && typeof metrics.avgScore === 'number') {
        const entry = scoreMap.get(dateKey) || { sum: 0, count: 0 };
        entry.sum += metrics.avgScore;
        entry.count += 1;
        scoreMap.set(dateKey, entry);
      }
      if (typeof row.costUsd === 'number') {
        costMap.set(row.model, (costMap.get(row.model) || 0) + row.costUsd);
      }
    }

    const scoreHistory = Array.from(scoreMap.entries())
      .map(([date, { sum, count }]) => ({ date, avgScore: sum / count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const costByModel = Array.from(costMap.entries()).map(
      ([model, totalCost]) => ({
        model,
        totalCost,
      }),
    );

    res.json({ scoreHistory, costByModel });
  } catch (err) {
    next(err);
  }
});

export default router;
