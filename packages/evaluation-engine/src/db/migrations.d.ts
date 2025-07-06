import Database from 'better-sqlite3';
export declare function runMigrationsOnConnection(
  sqlite: Database.Database,
): Promise<void>;
export declare function runMigrations(): Promise<void>;
export declare function generateMigration(name: string): Promise<void>;
