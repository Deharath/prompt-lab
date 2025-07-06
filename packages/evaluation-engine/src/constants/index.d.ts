export declare const RATE_LIMITS: {
  readonly WINDOW_MS: number;
  readonly GLOBAL_MAX: 100;
  readonly JOBS_MAX: 50;
};
export declare const TIMEOUTS: {
  readonly OPENAI_DEFAULT: 15000;
  readonly GEMINI_DEFAULT: 15000;
  readonly EVALUATION_DEFAULT: 15000;
  readonly HEALTH_CHECK: 5000;
};
export declare const DATABASE: {
  readonly MAX_CONNECTIONS: 10;
  readonly WAL_CHECKPOINT_INTERVAL: 1000;
  readonly CACHE_SIZE: 1000;
};
export declare const SECURITY: {
  readonly REQUEST_SIZE_LIMIT: '1mb';
  readonly MAX_RETRIES: 3;
};
export declare const LOGGING: {
  readonly MAX_FILE_SIZE: number;
  readonly MAX_FILES: 5;
  readonly DEFAULT_LEVEL: 'info';
};
export declare const EVALUATION: {
  readonly DEFAULT_CONCURRENCY: 5;
  readonly MAX_CONCURRENCY: 20;
  readonly MAX_CASES: 1000;
  readonly COST_PER_TOKEN: 0.00001;
};
export declare const PROVIDERS: {
  readonly OPENAI: {
    readonly NAME: 'openai';
    readonly DEFAULT_MODEL: 'gpt-4o-mini';
    readonly EMBEDDING_MODEL: 'text-embedding-3-small';
  };
  readonly GEMINI: {
    readonly NAME: 'gemini';
    readonly DEFAULT_MODEL: 'gemini-2.5-flash';
  };
};
export declare const HTTP_STATUS: {
  readonly OK: 200;
  readonly CREATED: 201;
  readonly BAD_REQUEST: 400;
  readonly UNAUTHORIZED: 401;
  readonly FORBIDDEN: 403;
  readonly NOT_FOUND: 404;
  readonly TOO_MANY_REQUESTS: 429;
  readonly INTERNAL_SERVER_ERROR: 500;
  readonly SERVICE_UNAVAILABLE: 503;
};
export declare const JOB_STATUS: {
  readonly PENDING: 'pending';
  readonly RUNNING: 'running';
  readonly COMPLETED: 'completed';
  readonly FAILED: 'failed';
};
export declare const ALLOWED_DATASETS: readonly ['news-summaries'];
export declare const ENVIRONMENTS: {
  readonly DEVELOPMENT: 'development';
  readonly TEST: 'test';
  readonly PRODUCTION: 'production';
};
export declare const LOG_TYPES: {
  readonly REQUEST: 'request';
  readonly RESPONSE: 'response';
  readonly JOB_CREATED: 'job_created';
  readonly JOB_STARTED: 'job_started';
  readonly JOB_COMPLETED: 'job_completed';
  readonly JOB_FAILED: 'job_failed';
  readonly HEALTH_CHECK: 'health_check';
};
