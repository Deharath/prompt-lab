import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database(process.env.DATABASE_URL || 'sqlite.db');
const db = drizzle(sqlite, { schema });

// Attach raw methods for test setup compatibility
(db as any).run = (sql: string) => sqlite.prepare(sql).run();
(db as any).exec = sqlite.exec.bind(sqlite);

export { db };
