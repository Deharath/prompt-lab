import { runMigrations } from './migrations.js';
declare function getDb(): Promise<
  import('drizzle-orm/better-sqlite3').BetterSQLite3Database<
    Record<string, unknown>
  >
>;
export declare const db: import('drizzle-orm/better-sqlite3').BetterSQLite3Database<
  Record<string, unknown>
>;
/**
 * Reset the database connection - useful for testing
 * This will force the next call to getDb() to create a new connection
 */
export declare function resetDb(): void;
export { getDb, runMigrations };
