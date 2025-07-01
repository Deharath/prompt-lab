import { Router } from 'express';
import { getDb, db, jobs } from '@prompt-lab/api';
import { gt } from 'drizzle-orm';

const router = Router();

router.get('/stats', async (req, res) => {
  const { days } = req.query as Record<string, string | undefined>;
  const parsed = days === undefined ? 30 : Number(days);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid 'days' parameter. Must be a positive integer." });
  }

  const since = new Date();
  since.setDate(since.getDate() - parsed);

  await getDb();
  const rows = await db
    .select({
      createdAt: jobs.createdAt,
      model: jobs.model,
      metrics: jobs.metrics,
      costUsd: jobs.costUsd,
    })
    .from(jobs)
    .where(gt(jobs.createdAt, since));

  const scoreMap = new Map<string, { total: number; count: number }>();
  const costMap = new Map<string, number>();

  for (const row of rows) {
    const dateKey = row.createdAt.toISOString().slice(0, 10);
    const avg = (row.metrics as { avgScore?: number } | null)?.avgScore;
    if (typeof avg === 'number') {
      const entry = scoreMap.get(dateKey) || { total: 0, count: 0 };
      entry.total += avg;
      entry.count += 1;
      scoreMap.set(dateKey, entry);
    }

    const cost = row.costUsd ?? 0;
    costMap.set(row.model, (costMap.get(row.model) ?? 0) + cost);
  }

  const scoreHistory = Array.from(scoreMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, { total, count }]) => ({
      date,
      avgScore: Number((total / count).toFixed(2)),
    }));

  const costByModel = Array.from(costMap.entries()).map(([model, total]) => ({
    model,
    totalCost: Number(total.toFixed(2)),
  }));

  res.json({ scoreHistory, costByModel });
});

export default router;
