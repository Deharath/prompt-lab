import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { runBatch } from '@prompt-lab/evaluator';
import {
  getEvaluator,
  type EvaluationCase,
  log,
  config,
  ALLOWED_DATASETS,
  EVALUATION,
} from '@prompt-lab/api';
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

// Define allowed dataset types
type AllowedDataset = (typeof ALLOWED_DATASETS)[number];

function validateDatasetId(id: string): id is AllowedDataset {
  return ALLOWED_DATASETS.includes(id as AllowedDataset);
}

function datasetPath(id: AllowedDataset) {
  return join(repoRoot, 'packages', 'test-cases', `${id}.jsonl`);
}

router.post('/', async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { promptTemplate, model, testSetId } = bodySchema.parse(req.body);

    log.info('Evaluation request started', {
      model,
      testSetId,
      promptLength: promptTemplate.length,
    });

    // Security: Validate testSetId to prevent path traversal attacks
    if (!validateDatasetId(testSetId)) {
      throw new ValidationError(
        `Invalid dataset ID. Allowed datasets: ${ALLOWED_DATASETS.join(', ')}`,
      );
    }

    if (!config.openai.apiKey) {
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

    const limit = pLimit(config.evaluation.concurrency);
    const evaluator = getEvaluator(model);

    const perItem = await Promise.all(
      cases.map((c) =>
        limit(() =>
          evaluator(promptTemplate, c, {
            model,
            timeout: config.evaluation.timeout,
          }),
        ),
      ),
    );

    // Create OpenAI client for scoring (still needed for runBatch)
    const openai = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: config.openai.timeout,
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
    const costUSD = totalTokens * EVALUATION.COST_PER_TOKEN;
    const duration = Date.now() - startTime;

    log.info('Evaluation completed successfully', {
      model,
      testSetId,
      caseCount: cases.length,
      avgCosSim,
      totalTokens,
      meanLatencyMs,
      costUSD,
      duration,
    });

    res.json({
      perItem,

      aggregates: { avgCosSim, totalTokens, meanLatencyMs, costUSD },
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    log.error(
      'Evaluation failed',
      { duration },
      err instanceof Error ? err : new Error(String(err)),
    );
    next(err);
  }
});

export default router;
