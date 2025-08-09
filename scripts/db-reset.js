#!/usr/bin/env node
/*
 * Dev helper: reset the SQLite DB at DATABASE_URL and run migrations.
 * - Does not require provider API keys (forces NODE_ENV=test for config).
 */
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Make config permissive (no API keys required)
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';

const cwd = process.cwd();
let dbUrl = process.env.DATABASE_URL || 'sqlite://./db/db.sqlite';
if (!dbUrl.startsWith('sqlite://')) {
  console.log(`[db:reset] Non-sqlite DATABASE_URL detected: ${dbUrl}`);
  console.log('[db:reset] This helper only supports sqlite URLs. Aborting.');
  process.exit(1);
}
let dbPath = dbUrl.replace('sqlite://', '');
if (dbPath === ':memory:') {
  console.log('[db:reset] :memory: DB does not need reset. Aborting.');
  process.exit(0);
}
// Resolve relative to repository root (cwd)
dbPath = resolve(cwd, dbPath);

const dbDir = dirname(dbPath);
mkdirSync(dbDir, { recursive: true });

if (existsSync(dbPath)) {
  console.log(`[db:reset] Removing ${dbPath}`);
  rmSync(dbPath);
} else {
  console.log(`[db:reset] No existing DB at ${dbPath}`);
}

// Try to run migrations via built dist; fall back to exit 0.
try {
  const mod = await import(
    '../packages/evaluation-engine/dist/src/db/migrations-drizzle.js'
  );
  if (typeof mod.runStandaloneMigrations === 'function') {
    console.log('[db:reset] Running migrations...');
    await mod.runStandaloneMigrations();
    console.log('[db:reset] Migrations completed.');
  } else {
    console.log(
      '[db:reset] migrations-drizzle.js found, but no runStandaloneMigrations(). Skipping.',
    );
  }
} catch (e) {
  console.log('[db:reset] Could not run migrations (is the engine built?).');
  console.log(
    '[db:reset] You can run: pnpm --filter @prompt-lab/evaluation-engine build',
  );
}

console.log('[db:reset] Done.');
