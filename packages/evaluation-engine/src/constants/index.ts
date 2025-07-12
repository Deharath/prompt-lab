// Application constants to eliminate magic numbers

// Rate limiting defaults
export const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GLOBAL_MAX: 100,
  JOBS_MAX: 50,
} as const;

// Timeout defaults (in milliseconds)
export const TIMEOUTS = {
  OPENAI_DEFAULT: 15000, // 15 seconds
  GEMINI_DEFAULT: 15000, // 15 seconds
  EVALUATION_DEFAULT: 15000, // 15 seconds
  HEALTH_CHECK: 5000, // 5 seconds
} as const;

// Database constants
export const DATABASE = {
  MAX_CONNECTIONS: 10,
  WAL_CHECKPOINT_INTERVAL: 1000, // WAL checkpoint interval
  CACHE_SIZE: 1000, // SQLite cache size
} as const;

// Security constants
export const SECURITY = {
  REQUEST_SIZE_LIMIT: '1mb',
  MAX_RETRIES: 3,
} as const;

// Logging constants
export const LOGGING = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  DEFAULT_LEVEL: 'info',
} as const;

// Evaluation constants
export const EVALUATION = {
  DEFAULT_CONCURRENCY: 5,
  MAX_CONCURRENCY: 20,
  MAX_CASES: 1000,
  COST_PER_TOKEN: 0.00001, // USD per token (rough estimate)
} as const;

// Provider constants
export const PROVIDERS = {
  OPENAI: {
    NAME: 'openai',
    DEFAULT_MODEL: 'gpt-4o-mini',
    EMBEDDING_MODEL: 'text-embedding-3-small',
  },
  GEMINI: {
    NAME: 'gemini',
    DEFAULT_MODEL: 'gemini-2.5-flash',
  },
} as const;

// Allowed dataset IDs for security
export const ALLOWED_DATASETS = ['news-summaries'] as const;

// Environment names
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;
