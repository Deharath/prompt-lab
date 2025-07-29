import { z } from 'zod';
import dotenv from 'dotenv';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  RATE_LIMITS,
  TIMEOUTS,
  DATABASE,
  SECURITY,
  LOGGING,
  EVALUATION,
  PROVIDERS,
  ENVIRONMENTS,
} from '../constants/index.js';

// Load environment variables - handle production and development differently
let rootDir: string;
let envLoaded = false;

try {
  // In production, environment variables are provided by container/platform
  if (process.env.NODE_ENV === 'production') {
    rootDir = process.cwd();
    envLoaded = true; // Production uses platform env vars
  } else {
    // In development, look for workspace root and .env file
    rootDir = process.cwd();

    // Look for workspace root by finding pnpm-workspace.yaml
    let currentDir = rootDir;
    while (currentDir !== dirname(currentDir)) {
      if (existsSync(join(currentDir, 'pnpm-workspace.yaml'))) {
        rootDir = currentDir;
        break;
      }
      currentDir = dirname(currentDir);
    }

    // Load .env file for development
    const envPath = join(rootDir, '.env');
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
      envLoaded = true;
    }
  }
} catch (error) {
  // In test environments, we might not need .env loading
  if (process.env.NODE_ENV !== 'test') {
    console.warn('Failed to load .env file:', error);
  }
}

// Create configuration schema dynamically based on environment
function createConfigSchema() {
  const isTestEnv = process.env.NODE_ENV === 'test';
  const isCIEnv =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  return z.object({
    // Server configuration
    server: z.object({
      port: z.coerce.number().min(1).max(65535).default(3000),
      env: z
        .enum([
          ENVIRONMENTS.DEVELOPMENT,
          ENVIRONMENTS.TEST,
          ENVIRONMENTS.PRODUCTION,
        ] as const)
        .default(ENVIRONMENTS.DEVELOPMENT),
      host: z.string().default('0.0.0.0'),
    }),

    // Database configuration
    database: z.object({
      url: z
        .string()
        .default(() => {
          // If DATABASE_URL is explicitly set, use it regardless of NODE_ENV
          if (process.env.DATABASE_URL) {
            return process.env.DATABASE_URL;
          }
          // Otherwise, fall back to environment-appropriate defaults
          return process.env.NODE_ENV === 'test' ? ':memory:' : 'sqlite://./db.sqlite';
        }),
      maxConnections: z.coerce
        .number()
        .min(1)
        .default(DATABASE.MAX_CONNECTIONS),
    }),

    // OpenAI configuration
    openai: z.object({
      apiKey:
        isTestEnv || isCIEnv
          ? z.string().optional().default('dummy-key-for-testing')
          : z.string().min(1, 'OpenAI API key is required'),
      timeout: z.coerce.number().min(1000).default(TIMEOUTS.OPENAI_DEFAULT),
      maxRetries: z.coerce.number().min(0).default(SECURITY.MAX_RETRIES),
      defaultModel: z.string().default(PROVIDERS.OPENAI.DEFAULT_MODEL),
    }),

    // Gemini configuration (optional)
    gemini: z.object({
      apiKey: z.string().optional(),
      timeout: z.coerce.number().min(1000).default(TIMEOUTS.GEMINI_DEFAULT),
      maxRetries: z.coerce.number().min(0).default(SECURITY.MAX_RETRIES),
    }),

    // Rate limiting configuration
    rateLimit: z.object({
      windowMs: z.coerce.number().min(1000).default(RATE_LIMITS.WINDOW_MS),
      globalMax: z.coerce.number().min(1).default(RATE_LIMITS.GLOBAL_MAX),
      jobsMax: z.coerce.number().min(1).default(RATE_LIMITS.JOBS_MAX),
    }),

    // Evaluation configuration
    evaluation: z.object({
      timeout: z.coerce.number().min(1000).default(TIMEOUTS.EVALUATION_DEFAULT),
      concurrency: z.coerce
        .number()
        .min(1)
        .max(EVALUATION.MAX_CONCURRENCY)
        .default(EVALUATION.DEFAULT_CONCURRENCY),
      maxCases: z.coerce.number().min(1).default(EVALUATION.MAX_CASES),
    }),

    // Logging configuration
    logging: z.object({
      level: z
        .enum(['error', 'warn', 'info', 'debug'])
        .default(LOGGING.DEFAULT_LEVEL as 'info'),
      enableFileLogging: z.coerce.boolean().default(false),
      maxFileSize: z.coerce.number().default(LOGGING.MAX_FILE_SIZE),
      maxFiles: z.coerce.number().default(LOGGING.MAX_FILES),
    }),

    // Security configuration
    security: z.object({
      requestSizeLimit: z.string().default(SECURITY.REQUEST_SIZE_LIMIT),
      enableTrustProxy: z.coerce.boolean().default(false),
    }),
  });
}

// Parse and validate configuration
function createConfig() {
  const configSchema = createConfigSchema();

  const rawConfig = {
    server: {
      port: process.env.PORT,
      env: process.env.NODE_ENV,
      host: process.env.HOST,
    },
    database: {
      url: process.env.DATABASE_URL,
      maxConnections: process.env.DB_MAX_CONNECTIONS,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      timeout: process.env.OPENAI_TIMEOUT_MS,
      maxRetries: process.env.OPENAI_MAX_RETRIES,
      defaultModel: process.env.OPENAI_DEFAULT_MODEL,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      timeout: process.env.GEMINI_TIMEOUT_MS,
      maxRetries: process.env.GEMINI_MAX_RETRIES,
    },
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS,
      globalMax: process.env.RATE_LIMIT_GLOBAL_MAX,
      jobsMax: process.env.RATE_LIMIT_JOBS_MAX,
    },
    evaluation: {
      timeout: process.env.EVALUATION_TIMEOUT_MS,
      concurrency: process.env.EVALUATION_CONCURRENCY,
      maxCases: process.env.EVALUATION_MAX_CASES,
    },
    logging: {
      level: process.env.LOG_LEVEL,
      enableFileLogging: process.env.ENABLE_FILE_LOGGING,
      maxFileSize: process.env.LOG_MAX_FILE_SIZE,
      maxFiles: process.env.LOG_MAX_FILES,
    },
    security: {
      requestSizeLimit: process.env.REQUEST_SIZE_LIMIT,
      enableTrustProxy:
        String(process.env.TRUST_PROXY).toLowerCase() === 'true',
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingRequired = error.errors
        .filter((e) => e.code === 'invalid_type' && e.received === 'undefined')
        .map((e) => e.path.join('.'));

      if (missingRequired.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missingRequired.join(', ')}\n` +
            'Please check your .env file or environment configuration.',
        );
      }
    }
    throw error;
  }
}

// Export singleton configuration
export const config = createConfig();

// Type export for use in other modules
export type Config = typeof config;

// Utility function to check if we're in a specific environment
export const isDevelopment = () =>
  config.server.env === ENVIRONMENTS.DEVELOPMENT;
export const isProduction = () => config.server.env === ENVIRONMENTS.PRODUCTION;
export const isTest = () => config.server.env === ENVIRONMENTS.TEST;
