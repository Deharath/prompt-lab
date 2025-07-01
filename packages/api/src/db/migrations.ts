import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function runMigrations() {
  try {
    // Parse and resolve database path as in index.ts
    let dbPath = config.database.url;
    if (dbPath.startsWith('sqlite://')) {
      dbPath = dbPath.replace('sqlite://', '');
    }
    // Always resolve relative to monorepo root
    const monorepoRoot = fileURLToPath(new URL('../../..', import.meta.url));
    if (dbPath !== ':memory:') {
      dbPath = resolve(monorepoRoot, dbPath);
    }

    // Ensure parent directory of the database file exists for file-based databases
    if (dbPath !== ':memory:') {
      const dbDir = dirname(dbPath);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
        log.info('Created parent directory for DB (migrations):', { dbDir });
      }
    }

    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    const migrationPath = join(__dirname, '../../drizzle/migrations');
    const fallbackPath = join(__dirname, '../../../drizzle/migrations');

    const resolvedPath = existsSync(migrationPath)
      ? migrationPath
      : fallbackPath;
    if (existsSync(resolvedPath)) {
      log.info('Running database migrations', { migrationPath: resolvedPath });
      await migrate(db, { migrationsFolder: resolvedPath });
      log.info('Database migrations completed successfully');
    } else {
      log.info('No migrations folder found, creating tables manually');
      // Create tables manually using the schema
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          prompt TEXT NOT NULL,
          model TEXT NOT NULL,
          provider TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          result TEXT,
          metrics TEXT,
          error_message TEXT,
          tokens_used INTEGER,
          cost_usd REAL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );

        CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
        CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs(created_at);
        CREATE INDEX IF NOT EXISTS jobs_provider_model_idx ON jobs(provider, model);
      `);
      log.info('Tables created successfully');
    }

    sqlite.close();
  } catch (error) {
    log.error(
      'Migration failed',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}

export async function generateMigration(name: string) {
  const { execSync } = await import('child_process');

  try {
    log.info('Generating migration', { name });
    execSync(`pnpm drizzle-kit generate:sqlite --name ${name}`, {
      cwd: join(__dirname, '../..'),
      stdio: 'inherit',
    });
    log.info('Migration generated successfully', { name });
  } catch (error) {
    log.error(
      'Migration generation failed',
      { name },
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}
