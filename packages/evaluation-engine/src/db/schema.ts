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
      enum: [
        'pending',
        'running',
        'evaluating',
        'completed',
        'failed',
        'cancelled',
      ],
    })
      .notNull()
      .default('pending'),
    result: text('result'),
    metrics: text('metrics', { mode: 'json' }),
    errorMessage: text('error_message'), // Error details
    errorType: text('error_type', {
      enum: [
        'provider_error',
        'timeout',
        'validation_error',
        'network_error',
        'rate_limit',
        'unknown',
      ],
    }), // Error categorization for retry logic
    tokensUsed: integer('tokens_used'),
    costUsd: real('cost_usd'),
    temperature: real('temperature'),
    topP: real('top_p'),
    maxTokens: integer('max_tokens'),
    selectedMetrics: text('selected_metrics', { mode: 'json' }), // Array of selected metric configs
    disabledMetrics: text('disabled_metrics', { mode: 'json' }), // Array of disabled metric IDs

    // Queue groundwork fields
    claimedAt: integer('claimed_at', { mode: 'timestamp' }),
    workerId: text('worker_id'),
    cancelRequested: integer('cancel_requested').default(0), // 0 = false, 1 = true

    attemptCount: integer('attempt_count').notNull().default(1),
    maxAttempts: integer('max_attempts').notNull().default(3),
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
    // Composite index to speed status-filtered, time-ordered queries
    statusCreatedAtIdx: index('jobs_status_created_at_idx').on(
      table.status,
      table.createdAt,
    ),
    providerModelIdx: index('jobs_provider_model_idx').on(
      table.provider,
      table.model,
    ),
    claimedAtIdx: index('jobs_claimed_at_idx').on(table.claimedAt),
    cancelRequestedIdx: index('jobs_cancel_requested_idx').on(
      table.cancelRequested,
    ),
    statusClaimedIdx: index('jobs_status_claimed_idx').on(
      table.status,
      table.claimedAt,
    ),
  }),
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
