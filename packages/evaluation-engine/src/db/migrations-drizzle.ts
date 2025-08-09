import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';

const __dirname = (() => {
  try {
    return fileURLToPath(new URL('.', import.meta.url));
  } catch (error) {
    // Fallback for test environments or when import.meta.url is not available
    // Final fallback - use current working directory
    return process.cwd();
  }
})();

export async function runDrizzleMigrations(sqlite: Database.Database) {
  try {
    const db = drizzle(sqlite);

    // --- Simple DB-based migration lock (SQLite) ---
    const nowSec = Math.floor(Date.now() / 1000);
    const LOCK_TTL_SEC = 300; // 5 minutes
    try {
      sqlite.exec(
        'CREATE TABLE IF NOT EXISTS migrations_lock (id text primary key, updated_at integer)',
      );
      // Try to acquire lock by inserting a single row with fixed id
      const insert = sqlite.prepare(
        'INSERT INTO migrations_lock (id, updated_at) VALUES (?, ?)',
      );
      try {
        insert.run('leader', nowSec);
        // acquired
      } catch (e) {
        // Already locked: check TTL
        const row = sqlite
          .prepare('SELECT updated_at FROM migrations_lock WHERE id = ?')
          .get('leader') as { updated_at?: number } | undefined;
        const ts = Number(row?.updated_at ?? 0);
        const age = nowSec - ts;
        if (age > LOCK_TTL_SEC) {
          // Stale lock: take over
          sqlite
            .prepare('DELETE FROM migrations_lock WHERE id = ?')
            .run('leader');
          insert.run('leader', nowSec);
        } else {
          log.info('Skipping migrations: another instance holds the lock', {
            ageSeconds: age,
          });
          return; // do not run migrations
        }
      }
    } catch (e) {
      // If lock fails, continue without it (best-effort in dev)
      log.warn('Migration lock unavailable; continuing without lock', {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    // More comprehensive search for migration path
    const possiblePaths = [
      // Standard development/build path
      join(__dirname, '../../drizzle/migrations'),
      // Production build path (if in dist folder)
      join(__dirname, '../../../drizzle/migrations'),
      // Monorepo from working directory
      join(process.cwd(), 'packages/evaluation-engine/drizzle/migrations'),
      // Direct from working directory (for Docker/production)
      join(process.cwd(), 'drizzle/migrations'),
      // Try from package root
      join(process.cwd(), 'evaluation-engine/drizzle/migrations'),
    ];

    let migrationPath = '';
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        migrationPath = path;
        break;
      }
    }

    if (!migrationPath) {
      // If no migration folder found, log all attempted paths for debugging
      log.error('Migration folder not found. Searched paths:', {
        searchedPaths: possiblePaths,
        currentWorkingDir: process.cwd(),
        __dirname,
      });

      throw new Error(
        `Migration folder not found. Searched paths: ${possiblePaths.join(', ')}`,
      );
    }

    log.info('Running Drizzle migrations', {
      migrationPath,
      currentWorkingDir: process.cwd(),
    });

    await migrate(db, { migrationsFolder: migrationPath });
    try {
      // Release lock
      sqlite.prepare('DELETE FROM migrations_lock WHERE id = ?').run('leader');
    } catch (_e) {
      void _e;
    }
    log.info('Database migrations completed successfully');
  } catch (error) {
    log.error(
      'Migration failed',
      {
        currentDir: process.cwd(),
        dirname: __dirname,
        error: error instanceof Error ? error.message : String(error),
      },
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}

export async function runStandaloneMigrations() {
  try {
    // Parse and resolve database path
    let dbPath = config.database.url;
    if (dbPath.startsWith('sqlite://')) {
      dbPath = dbPath.replace('sqlite://', '');
    }

    // Always resolve relative to monorepo root
    const monorepoRoot = fileURLToPath(new URL('../../..', import.meta.url));
    if (dbPath !== ':memory:') {
      dbPath = resolve(monorepoRoot, dbPath);
    }

    // Ensure parent directory exists
    if (dbPath !== ':memory:') {
      const dbDir = dirname(dbPath);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
        log.info('Created parent directory for DB:', { dbDir });
      }
    }

    const sqlite = new Database(dbPath);

    // Enable optimizations
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('foreign_keys = ON');

    await runDrizzleMigrations(sqlite);
    sqlite.close();
  } catch (error) {
    log.error(
      'Standalone migration failed',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}
