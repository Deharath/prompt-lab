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
