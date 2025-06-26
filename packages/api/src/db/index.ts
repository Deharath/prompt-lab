import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle> | null = null;

function initializeDb() {
  if (!_db) {
    const sqlite = new Database(process.env.DATABASE_URL || 'sqlite.db');
    _db = drizzle(sqlite, { schema });
    
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
