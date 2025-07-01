import type { Config } from 'drizzle-kit';

// Drizzle Kit migration config for local SQLite
// If you need D1, use a separate config or script.

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/prompt-lab.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
