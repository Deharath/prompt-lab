import { Router, type Router as ExpressRouter } from 'express';
import { createJob, streamJob } from '@prompt-lab/jobs';
import { getProvider } from '@prompt-lab/providers';

const router: ExpressRouter = Router();

router.post('/', (req, res) => {
  getProvider();
  createJob();
  res.json({ status: 'created' });
});

router.get('/stream', (req, res) => {
  streamJob();
  res.json({ status: 'streaming' });
});

export default router;
