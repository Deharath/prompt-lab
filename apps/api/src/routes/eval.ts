import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const evalSchema = z.object({
  promptTemplate: z.string(),
  model: z.string(),
  testSetId: z.string(),
});

router.post('/', (req, res) => {
  const parsed = evalSchema.parse(req.body);

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      ...parsed,
      completion: 'mock: OPENAI_API_KEY missing',
    });
  }

  return res.json(parsed);
});

export default router;
