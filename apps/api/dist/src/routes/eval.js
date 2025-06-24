import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pLimit from 'p-limit';
import { applyTemplate, runBatch } from '@prompt-lab/evaluator';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const router = Router();
const bodySchema = z.object({
    promptTemplate: z.string(),
    model: z.string(),
    testSetId: z.string(),
});
// Absolute path to repo root, regardless of where the process starts
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
function datasetPath(id) {
    return join(repoRoot, 'packages', 'test-cases', `${id}.jsonl`);
}
router.post('/', async (req, res, next) => {
    try {
        const { promptTemplate, model, testSetId } = bodySchema.parse(req.body);
        if (!process.env.OPENAI_API_KEY) {
            res.status(503).json({ error: 'OpenAI key not configured' });
            return;
        }
        let raw;
        try {
            raw = await fs.readFile(datasetPath(testSetId), 'utf8');
        }
        catch (readErr) {
            if (readErr.code === 'ENOENT') {
                res.status(404).json({ error: 'Dataset not found' });
                return;
            }
            throw readErr;
        }
        const cases = raw
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line));
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 15000,
        });
        const genAI = process.env.GEMINI_API_KEY
            ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
            : null;
        const limit = pLimit(5);
        const generateCompletion = async (c) => {
            var _a, _b, _c, _d;
            const prompt = applyTemplate(promptTemplate, { input: c.input });
            const start = Date.now();
            let completion = '';
            let tokens = 0;
            if (model.startsWith('gpt-4.1')) {
                const resp = await openai.chat.completions.create({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                });
                completion = ((_b = (_a = resp.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
                tokens = (_d = (_c = resp.usage) === null || _c === void 0 ? void 0 : _c.total_tokens) !== null && _d !== void 0 ? _d : 0;
            }
            else if (model === 'gemini-2.5-flash') {
                if (genAI) {
                    const gemModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 15000);
                    try {
                        const resp = await gemModel.generateContent(prompt, {
                            signal: controller.signal,
                        });
                        completion = resp.response.text();
                    }
                    finally {
                        clearTimeout(timer);
                    }
                }
                else {
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
        const perItem = await Promise.all(cases.map((c) => limit(() => generateCompletion(c))));
        const scores = await runBatch(openai, perItem.map((p) => ({
            prediction: p.prediction,
            reference: p.reference,
        })));
        let avgCosSim = 0;
        let totalTokens = 0;
        let totalLatency = 0;
        scores.forEach((score, idx) => {
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
    }
    catch (err) {
        next(err);
    }
});
export default router;
