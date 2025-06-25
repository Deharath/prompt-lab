import { Router } from 'express';
// eslint-disable-next-line import/extensions
import { createJob, streamJob } from '@prompt-lab/jobs/controller.js';
// eslint-disable-next-line import/extensions
import { getProvider } from '@prompt-lab/providers/index.js';

const router: Router = Router();

router.post('/', (req, res) => {
  getProvider();
  const job = createJob();
  res.json(job);
});

router.get('/:id/stream', (req, res) => {
  streamJob();
  res.end();
});

export default router;
