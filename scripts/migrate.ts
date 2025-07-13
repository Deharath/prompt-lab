import { runMigrations } from '../packages/evaluation-engine/dist/index.js';

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
