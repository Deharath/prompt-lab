"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobs = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.jobs = (0, sqlite_core_1.sqliteTable)('jobs', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    prompt: (0, sqlite_core_1.text)('prompt').notNull(),
    provider: (0, sqlite_core_1.text)('provider').notNull(),
    model: (0, sqlite_core_1.text)('model').notNull(),
    status: (0, sqlite_core_1.text)('status', { enum: ['pending', 'running', 'completed', 'failed'] })
        .notNull()
        .default('pending'),
    result: (0, sqlite_core_1.text)('result'),
    metrics: (0, sqlite_core_1.text)('metrics', { mode: 'json' }),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' })
        .notNull()
        .default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
    updatedAt: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' })
        .notNull()
        .default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
