import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { applyTemplate, runBatch } from 'evaluator';

const router = Router();

const bodySchema = z.object({
  promptTemplate: z.string(),
  model: z.string(),
  testSetId: z.string(),
});

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function datasetPath(id: string): string {
  return path.join(
    __dirname,
    '../../../..',
    'packages',
    'test-cases',
    `${id}.jsonl`,
  );
}

router.post('/', async (req, res, next) => {
  try {
    const { promptTemplate, model, testSetId } = bodySchema.parse(req.body);

    if (!process.env.OPENAI_API_KEY) {
      res.status(503).json({ error: 'OpenAI key not configured' });
      return;
    }

    const raw = await fs.readFile(datasetPath(testSetId), 'utf8');
    const cases = raw
      .trim()
      .split('\n')
      .map(
        (line) =>
          JSON.parse(line) as { id: string; input: string; expected: string },
      );

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    interface Item {
      id: string;
      prediction: string;
      reference: string;
      latencyMs: number;
      tokens: number;
      score?: number;
    }

    const perItem: Item[] = await Promise.all(
      cases.map(async (c) => {
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
          if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const gemModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const resp = await gemModel.generateContent(prompt);
            completion = resp.response.text();
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
      }),
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
      aggregates: { avgCosSim, totalTokens, meanLatencyMs, costUSD },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
