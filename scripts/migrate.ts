import { runMigrations } from '@prompt-lab/evaluation-engine';

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
