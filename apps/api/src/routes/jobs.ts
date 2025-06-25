import { Router, type Router as ExpressRouter } from 'express';
import { createJob, streamJob } from '@prompt-lab/jobs/controller';
import { getProvider } from '@prompt-lab/providers';

const router: ExpressRouter = Router();

router.post('/', (req, res) => {
  const provider = getProvider(req.body.provider);
  const job = createJob({ provider });
  res.json(job);
});

router.get('/:id/stream', async (req, res) => {
  const stream = await streamJob(req.params.id);
  res.json(stream);
});

export default router;
