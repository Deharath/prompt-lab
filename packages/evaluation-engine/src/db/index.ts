import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';
import { runDrizzleMigrations } from './migrations-drizzle.js';
import * as schema from './schema.js';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import path from 'node:path';

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
      const rootDir = (() => {
        try {
          // Only use import.meta.url in proper ESM contexts
          if (typeof import.meta?.url === 'string' && import.meta.url.startsWith('file:')) {
            return fileURLToPath(new URL('../../..', import.meta.url));
          }
        } catch (error) {
          // Fallback for test environments
        }
        
        // Fallback: traverse up from cwd to find workspace root
        let currentDir = process.cwd();
        while (currentDir !== path.dirname(currentDir)) {
          if (existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
            return currentDir;
          }
          currentDir = path.dirname(currentDir);
        }
        return process.cwd();
      })();
      if (dbPath !== ':memory:') {
        dbPath = resolve(rootDir, dbPath);

        // Ensure the database directory exists
        const dbDir = dbPath.substring(0, dbPath.lastIndexOf('/'));
        if (dbDir) {
          await import('fs').then((fs) =>
            fs.promises.mkdir(dbDir, { recursive: true }),
          );
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

      // Run Drizzle migrations on the SAME connection we'll use for Drizzle
      await runDrizzleMigrations(sqlite);

      _db = drizzle(sqlite, { schema });

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
