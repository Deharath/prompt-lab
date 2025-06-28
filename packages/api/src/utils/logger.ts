import winston from 'winston';
import { config } from '../config/index.js';

// Create winston logger with structured format
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'prompt-lab-api' },
  transports: [
    // Error logs to file in production
    ...(config.logging.enableFileLogging || config.server.env === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: config.logging.maxFileSize,
            maxFiles: config.logging.maxFiles,
          }),
        ]
      : []),

    // All logs to console with appropriate formatting
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// Structured logging interface
export interface LogContext {
  [key: string]: unknown;
  jobId?: string;
  userId?: string;
  provider?: string;
  model?: string;
  requestId?: string;
}

// Enhanced logger with context support
export const log = {
  error: (message: string, context?: LogContext, error?: Error) => {
    logger.error(message, {
      ...context,
      error: error?.stack || error?.message,
    });
  },

  warn: (message: string, context?: LogContext) => {
    logger.warn(message, context);
  },

  info: (message: string, context?: LogContext) => {
    logger.info(message, context);
  },

  debug: (message: string, context?: LogContext) => {
    logger.debug(message, context);
  },

  // Request/response logging for HTTP endpoints
  request: (method: string, path: string, context?: LogContext) => {
    logger.info('HTTP Request', {
      type: 'request',
      method,
      path,
      ...context,
    });
  },

  response: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ) => {
    logger.info('HTTP Response', {
      type: 'response',
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  },

  // Job-specific logging
  jobCreated: (jobId: string, context?: LogContext) => {
    logger.info('Job created', { type: 'job_created', jobId, ...context });
  },

  jobStarted: (jobId: string, context?: LogContext) => {
    logger.info('Job started', { type: 'job_started', jobId, ...context });
  },

  jobCompleted: (jobId: string, duration: number, context?: LogContext) => {
    logger.info('Job completed', {
      type: 'job_completed',
      jobId,
      duration,
      ...context,
    });
  },

  jobFailed: (jobId: string, error: Error, context?: LogContext) => {
    logger.error('Job failed', {
      type: 'job_failed',
      jobId,
      error: error.stack || error.message,
      ...context,
    });
  },
};

export default logger;
