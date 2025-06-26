import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pLimit from 'p-limit';
import { applyTemplate, runBatch } from '@prompt-lab/evaluator';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const router: ExpressRouter = Router();

const bodySchema = z.object({
  promptTemplate: z.string(),
  model: z.string(),
  testSetId: z.string(),
});

// Absolute path to repo root, regardless of where the process starts
const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url));

function datasetPath(id: string) {
  return join(repoRoot, 'packages', 'test-cases', `${id}.jsonl`);
}

router.post('/', async (req, res, next) => {
  try {
    const { promptTemplate, model, testSetId } = bodySchema.parse(req.body);

    if (!process.env.OPENAI_API_KEY) {
      res.status(503).json({ error: 'OpenAI key not configured' });
      return;
    }

    let raw: string;
    try {
      raw = await fs.readFile(datasetPath(testSetId), 'utf8');
    } catch (readErr) {
      if ((readErr as NodeJS.ErrnoException).code === 'ENOENT') {
        res.status(404).json({ error: 'Dataset not found' });
        return;
      }
      throw readErr;
    }
    const cases = raw
      .trim()
      .split('\n')
      .map(
        (line) =>
          // eslint-disable-next-line implicit-arrow-linebreak
          JSON.parse(line) as {
            id: string;
            input: string;
            expected: string;
          },
      );

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15000,
    });
    const genAI = process.env.GEMINI_API_KEY
      ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      : null;

    const limit = pLimit(5);

    interface Item {
      id: string;
      prediction: string;
      reference: string;
      latencyMs: number;
      tokens: number;
      score?: number;
    }

    const generateCompletion = async (c: {
      id: string;
      input: string;
      expected: string;
    }): Promise<Item> => {
      const prompt = applyTemplate(promptTemplate, { input: c.input });
      const start = Date.now();
      let completion = '';
      let tokens = 0;

      if (model.startsWith('gpt-4.1')) {
        const resp = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
        });
        completion = resp.choices[0]?.message?.content || '';
        tokens = resp.usage?.total_tokens ?? 0;
      } else if (model === 'gemini-2.5-flash') {
        if (genAI) {
          const gemModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15000);
          try {
            const resp = await gemModel.generateContent(prompt, {
              signal: controller.signal,
            });
            completion = resp.response.text();
          } finally {
            clearTimeout(timer);
          }
        } else {
          completion = 'MOCK_GEMINI_RESPONSE';
        }
      }
      const latencyMs = Date.now() - start;
      return {
        id: c.id,
        prediction: completion,
        reference: c.expected,
        latencyMs,
        tokens,
      };
    };
    const perItem: Item[] = await Promise.all(
      cases.map((c) => limit(() => generateCompletion(c))),
    );

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
      // eslint-disable-next-line object-curly-newline
      aggregates: { avgCosSim, totalTokens, meanLatencyMs, costUSD },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
