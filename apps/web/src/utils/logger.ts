export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, data);
    }
  }

  error(message: string, data?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, data);
    }
  }
}

export const logger = new Logger();
/**
 * Generates a consistent result snippet from output text
 * @param text - The full output text
 * @param maxLength - Maximum length of the snippet (default: 100)
 * @returns A trimmed snippet with ellipsis if truncated
 */
export const generateResultSnippet = (
  text: string,
  maxLength: number = 100,
): string | null => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const trimmedText = text.trim();

  if (trimmedText.length <= maxLength) {
    return trimmedText;
  }

  return trimmedText.substring(0, maxLength) + '...';
};

if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
} else {
  logger.setLevel(LogLevel.WARN);
}
