import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { runBatch } from '@prompt-lab/evaluator';
import { getEvaluator, type EvaluationCase } from '@prompt-lab/api';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../errors/ApiError.js';

const router: ExpressRouter = Router();

const bodySchema = z.object({
  promptTemplate: z.string(),
  model: z.string(),
  testSetId: z.string(),
});

// Absolute path to repo root, regardless of where the process starts
const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url));

// Security: Define allowed dataset IDs to prevent path traversal attacks
const ALLOWED_DATASETS = ['news-summaries'] as const;
type AllowedDataset = (typeof ALLOWED_DATASETS)[number];

function validateDatasetId(id: string): id is AllowedDataset {
  return ALLOWED_DATASETS.includes(id as AllowedDataset);
}

function datasetPath(id: AllowedDataset) {
  return join(repoRoot, 'packages', 'test-cases', `${id}.jsonl`);
}

router.post('/', async (req, res, next) => {
  try {
    const { promptTemplate, model, testSetId } = bodySchema.parse(req.body);

    // Security: Validate testSetId to prevent path traversal attacks
    if (!validateDatasetId(testSetId)) {
      throw new ValidationError(
        `Invalid dataset ID. Allowed datasets: ${ALLOWED_DATASETS.join(', ')}`,
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new ServiceUnavailableError('OpenAI key not configured');
    }

    let raw: string;
    try {
      raw = await fs.readFile(datasetPath(testSetId), 'utf8');
    } catch (readErr) {
      if ((readErr as { code?: string }).code === 'ENOENT') {
        throw new NotFoundError('Dataset not found');
      }
      throw readErr;
    }
    const cases: EvaluationCase[] = raw
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));

    const limit = pLimit(5);
    const evaluator = getEvaluator(model);

    // Get timeout from environment or use default
    const timeout = process.env.EVALUATION_TIMEOUT_MS
      ? parseInt(process.env.EVALUATION_TIMEOUT_MS, 10)
      : 15000;

    const perItem = await Promise.all(
      cases.map((c) =>
        limit(() => evaluator(promptTemplate, c, { model, timeout })),
      ),
    );

    // Create OpenAI client for scoring (still needed for runBatch)
    if (!process.env.OPENAI_API_KEY) {
      throw new ServiceUnavailableError(
        'OpenAI API key required for evaluation scoring',
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout,
    });

    const scores = await runBatch(
      openai,
      perItem.map((p) => ({
        prediction: p.prediction,
        reference: p.reference,
      })),
    );

    let avgCosSim = 0;
    let totalTokens = 0;
    let totalLatency = 0;
    scores.forEach((score: number, idx: number) => {
      perItem[idx].score = score;
      avgCosSim += score;
      totalTokens += perItem[idx].tokens;
      totalLatency += perItem[idx].latencyMs;
    });
    avgCosSim /= scores.length;
    const meanLatencyMs = totalLatency / scores.length;
    const costUSD = totalTokens * 0.00001;

    res.json({
      perItem,

      aggregates: { avgCosSim, totalTokens, meanLatencyMs, costUSD },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
