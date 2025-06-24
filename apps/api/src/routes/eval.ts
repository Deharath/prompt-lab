import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(__filename);

const router = Router();

const evalSchema = z.object({
  promptTemplate: z.string(),
  model: z.string(),
  testSetId: z.string(),
});

router.post('/', (req, res) => {
  const parsed = evalSchema.parse(req.body);
  // Example path usage to locate test cases
  const testCasesPath = path.join(
    __dirname,
    '../../../packages/test-cases/news-summaries.jsonl',
  );
  // For now we don't read the file, but ensure the path resolves correctly
  if (!testCasesPath) {
    res.status(500).end();
    return;
  }
  res.json(parsed);
});

export default router;
