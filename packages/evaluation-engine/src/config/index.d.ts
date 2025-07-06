export declare const config: {
  gemini: {
    timeout: number;
    maxRetries: number;
    apiKey?: string | undefined;
  };
  openai: {
    apiKey: string;
    timeout: number;
    maxRetries: number;
    defaultModel: string;
  };
  server: {
    port: number;
    env: 'development' | 'test' | 'production';
    host: string;
  };
  database: {
    url: string;
    maxConnections: number;
  };
  rateLimit: {
    windowMs: number;
    globalMax: number;
    jobsMax: number;
  };
  evaluation: {
    timeout: number;
    concurrency: number;
    maxCases: number;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    enableFileLogging: boolean;
    maxFileSize: number;
    maxFiles: number;
  };
  security: {
    requestSizeLimit: string;
    enableTrustProxy: boolean;
  };
};
export type Config = typeof config;
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
export declare const isTest: () => boolean;
