export declare const jobs: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
  name: 'jobs';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'id';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      object
    >;
    prompt: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'prompt';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      object
    >;
    template: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'template';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      object
    >;
    inputData: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'input_data';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      object
    >;
    provider: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'provider';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      object
    >;
    model: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'model';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      object
    >;
    status: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'status';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: 'pending' | 'running' | 'completed' | 'failed';
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: ['pending', 'running', 'completed', 'failed'];
        baseColumn: never;
      },
      object
    >;
    result: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'result';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      object
    >;
    metrics: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'metrics';
        tableName: 'jobs';
        dataType: 'json';
        columnType: 'SQLiteTextJson';
        data: unknown;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
    errorMessage: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'error_message';
        tableName: 'jobs';
        dataType: 'string';
        columnType: 'SQLiteText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
      },
      object
    >;
    tokensUsed: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'tokens_used';
        tableName: 'jobs';
        dataType: 'number';
        columnType: 'SQLiteInteger';
        data: number;
        driverParam: number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
    costUsd: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'cost_usd';
        tableName: 'jobs';
        dataType: 'number';
        columnType: 'SQLiteReal';
        data: number;
        driverParam: number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
    temperature: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'temperature';
        tableName: 'jobs';
        dataType: 'number';
        columnType: 'SQLiteReal';
        data: number;
        driverParam: number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
    topP: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'top_p';
        tableName: 'jobs';
        dataType: 'number';
        columnType: 'SQLiteReal';
        data: number;
        driverParam: number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
    maxTokens: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'max_tokens';
        tableName: 'jobs';
        dataType: 'number';
        columnType: 'SQLiteInteger';
        data: number;
        driverParam: number;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
    selectedMetrics: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'selected_metrics';
        tableName: 'jobs';
        dataType: 'json';
        columnType: 'SQLiteTextJson';
        data: unknown;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
    createdAt: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'created_at';
        tableName: 'jobs';
        dataType: 'date';
        columnType: 'SQLiteTimestamp';
        data: Date;
        driverParam: number;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
    updatedAt: import('drizzle-orm/sqlite-core').SQLiteColumn<
      {
        name: 'updated_at';
        tableName: 'jobs';
        dataType: 'date';
        columnType: 'SQLiteTimestamp';
        data: Date;
        driverParam: number;
        notNull: true;
        hasDefault: true;
        enumValues: undefined;
        baseColumn: never;
      },
      object
    >;
  };
  dialect: 'sqlite';
}>;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
