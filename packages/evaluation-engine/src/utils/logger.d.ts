import winston from 'winston';
declare const logger: winston.Logger;
export interface LogContext {
  [key: string]: unknown;
  jobId?: string;
  userId?: string;
  provider?: string;
  model?: string;
  requestId?: string;
}
export declare const log: {
  error: (message: string, context?: LogContext, error?: Error) => void;
  warn: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
  request: (method: string, path: string, context?: LogContext) => void;
  response: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ) => void;
  jobCreated: (jobId: string, context?: LogContext) => void;
  jobStarted: (jobId: string, context?: LogContext) => void;
  jobCompleted: (jobId: string, duration: number, context?: LogContext) => void;
  jobFailed: (jobId: string, error: Error, context?: LogContext) => void;
};
export default logger;
