import {
  sqliteTable,
  text,
  integer,
  index,
  real,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    prompt: text('prompt').notNull(),
    template: text('template'), // Original template before input substitution
    inputData: text('input_data'), // Original input data
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    status: text('status', {
      enum: ['pending', 'running', 'completed', 'failed'],
    })
      .notNull()
      .default('pending'),
    result: text('result'),
    metrics: text('metrics', { mode: 'json' }),
    errorMessage: text('error_message'), // New field for error details
    tokensUsed: integer('tokens_used'),
    costUsd: real('cost_usd'),
    temperature: real('temperature'),
    topP: real('top_p'),
    maxTokens: integer('max_tokens'),
    selectedMetrics: text('selected_metrics', { mode: 'json' }), // Array of selected metric configs
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    // Indexes for better query performance
    statusIdx: index('jobs_status_idx').on(table.status),
    createdAtIdx: index('jobs_created_at_idx').on(table.createdAt),
    providerModelIdx: index('jobs_provider_model_idx').on(
      table.provider,
      table.model,
    ),
  }),
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
