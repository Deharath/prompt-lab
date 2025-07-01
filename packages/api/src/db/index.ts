import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';
import { runMigrations } from './migrations.js';
import * as schema from './schema.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

let _db: ReturnType<typeof drizzle> | null = null;

async function initializeDb() {
  if (!_db) {
    try {
      // Parse database URL to get file path
      let dbPath = config.database.url;
      if (dbPath.startsWith('sqlite://')) {
        dbPath = dbPath.replace('sqlite://', '');
      }

      // Always resolve relative to monorepo root
      const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
      if (dbPath !== ':memory:') {
        dbPath = resolve(rootDir, dbPath);
      }

      console.log('🗃️ Database path:', dbPath);
      console.log('🗂️ Current working directory:', process.cwd());

      // Ensure directory exists for file-based databases
      if (dbPath !== ':memory:') {
        const dir = dirname(dbPath);
        const { mkdirSync, existsSync } = await import('node:fs');
        if (!existsSync(dir)) {
          console.log('📁 Creating directory:', dir);
          mkdirSync(dir, { recursive: true });
        } else {
          console.log('✅ Directory already exists:', dir);
        }
      }

      // Initialize database connection first
      const sqlite = new Database(dbPath);

      // Enable WAL mode for better performance
      if (dbPath !== ':memory:' && typeof sqlite.pragma === 'function') {
        sqlite.pragma('journal_mode = WAL');
        sqlite.pragma('synchronous = NORMAL');
        sqlite.pragma('cache_size = 1000');
        sqlite.pragma('foreign_keys = ON');
      }

      _db = drizzle(sqlite, { schema });

      // Run migrations if available, otherwise create tables manually
      const { join } = await import('node:path');
      const { existsSync } = await import('node:fs');

      const __dirname = fileURLToPath(new URL('.', import.meta.url));
      const migrationPath = join(__dirname, '../../drizzle/migrations');
      const fallbackPath = join(__dirname, '../../../drizzle/migrations');
      const hasMigrations =
        existsSync(migrationPath) || existsSync(fallbackPath);

      if (hasMigrations && dbPath !== ':memory:') {
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
        url: dbPath,
        mode: dbPath === ':memory:' ? 'memory' : 'file',
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

/**
 * Reset the database connection - useful for testing
 * This will force the next call to getDb() to create a new connection
 */
export function resetDb() {
  _db = null;
  dbInitPromise = null;
}

export { getDb };
