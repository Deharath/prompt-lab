import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';
import { runMigrations } from './migrations.js';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle> | null = null;

async function initializeDb() {
  if (!_db) {
    try {
      // Initialize database connection first
      const sqlite = new Database(config.database.url);

      // Enable WAL mode for better performance
      if (config.database.url !== ':memory:') {
        sqlite.pragma('journal_mode = WAL');
        sqlite.pragma('synchronous = NORMAL');
        sqlite.pragma('cache_size = 1000');
        sqlite.pragma('foreign_keys = ON');
      }

      _db = drizzle(sqlite, { schema });

      // Run migrations if available, otherwise create tables manually
      const { join } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const { existsSync } = await import('node:fs');

      const __dirname = fileURLToPath(new URL('.', import.meta.url));
      const migrationPath = join(__dirname, '../../drizzle/migrations');
      const fallbackPath = join(__dirname, '../../../drizzle/migrations');
      const hasMigrations =
        existsSync(migrationPath) || existsSync(fallbackPath);

      if (hasMigrations && config.database.url !== ':memory:') {
        await runMigrations();
      } else {
        log.info('No migrations folder found, creating tables manually');
        // Create tables manually using the schema
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
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

      // Attach raw methods for test setup compatibility
      Object.assign(_db, {
        run: (sql: string) => sqlite.prepare(sql).run(),
        exec: sqlite.exec.bind(sqlite),
      });

      log.info('Database initialized successfully', {
        url: config.database.url,
        mode: config.database.url === ':memory:' ? 'memory' : 'file',
      });
    } catch (error) {
      log.error(
        'Database initialization failed',
        {},
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }
  return _db;
}

// Initialize database eagerly for better error handling
let dbInitPromise: Promise<ReturnType<typeof drizzle>> | null = null;

function getDb() {
  if (!dbInitPromise) {
    dbInitPromise = initializeDb();
  }
  return dbInitPromise;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop: string | symbol) {
    if (!_db) {
      throw new Error('Database not initialized. Call await getDb() first.');
    }
    return (_db as never)[prop];
  },
});

export { getDb };
