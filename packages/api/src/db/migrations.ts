import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function runMigrations() {
  try {
    // Ensure data directory exists for file-based databases
    if (
      config.database.url !== ':memory:' &&
      !config.database.url.startsWith('file:')
    ) {
      const dbDir = join(__dirname, '../../data');
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }
    }

    const sqlite = new Database(config.database.url);
    const db = drizzle(sqlite);

    const migrationPath = join(__dirname, '../../drizzle/migrations');

    if (existsSync(migrationPath)) {
      log.info('Running database migrations', { migrationPath });
      await migrate(db, { migrationsFolder: migrationPath });
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
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          completed_at INTEGER,
          result TEXT,
          error TEXT
        );
        
        CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
        CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs(created_at);
        CREATE INDEX IF NOT EXISTS jobs_provider_idx ON jobs(provider);
        CREATE INDEX IF NOT EXISTS jobs_model_idx ON jobs(model);
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
