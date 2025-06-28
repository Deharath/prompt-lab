import { runMigrations } from '@prompt-lab/api';

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
