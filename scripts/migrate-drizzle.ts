#!/usr/bin/env node

import { runStandaloneMigrations } from '../packages/evaluation-engine/src/db/migrations-drizzle.js';

async function main() {
  try {
    console.log('🔄 Running database migrations with Drizzle Kit...');
    await runStandaloneMigrations();
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}
