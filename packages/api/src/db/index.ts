import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle> | null = null;

function initializeDb() {
  if (!_db) {
    const sqlite = new Database(process.env.DATABASE_URL || 'sqlite.db');
    _db = drizzle(sqlite, { schema });
    
    // Create the jobs table if it doesn't exist
    try {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          prompt TEXT NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          result TEXT,
          metrics TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )
      `);
    } catch (error) {
      console.warn('Warning: Could not create jobs table:', error);
    }
    
    // Attach raw methods for test setup compatibility
    (_db as any).run = (sql: string) => sqlite.prepare(sql).run();
    (_db as any).exec = sqlite.exec.bind(sqlite);
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const actualDb = initializeDb();
    return (actualDb as any)[prop];
  }
});
