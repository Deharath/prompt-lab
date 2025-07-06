/**
 * Task 6 - Basic Latency Logging
 * Wrap generation pipeline with performance.now()
 * Write p50/p95/p99 to rotating JSON log in logs/metrics/
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';

export interface LatencyMeasurement {
  timestamp: number;
  duration: number;
  operation: string;
  metadata?: Record<string, unknown>;
}

export interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  count: number;
  min: number;
  max: number;
}

class LatencyLogger {
  private measurements: LatencyMeasurement[] = [];
  private logDir: string;

  constructor(logDir = 'logs/metrics') {
    this.logDir = logDir;
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create metrics log directory:', error);
    }
  }

  /**
   * Record a latency measurement
   */
  record(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ) {
    const measurement: LatencyMeasurement = {
      timestamp: Date.now(),
      duration,
      operation,
      metadata,
    };

    this.measurements.push(measurement);

    // Keep only last 10000 measurements in memory
    if (this.measurements.length > 10000) {
      this.measurements = this.measurements.slice(-5000);
    }
  }

  /**
   * Calculate percentiles from an array of durations
   */
  private calculatePercentiles(durations: number[]): LatencyStats {
    if (durations.length === 0) {
      return { p50: 0, p95: 0, p99: 0, mean: 0, count: 0, min: 0, max: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const count = sorted.length;

    const p50Index = Math.ceil(0.5 * count) - 1;
    const p95Index = Math.ceil(0.95 * count) - 1;
    const p99Index = Math.ceil(0.99 * count) - 1;

    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      p50: sorted[Math.max(0, p50Index)],
      p95: sorted[Math.max(0, p95Index)],
      p99: sorted[Math.max(0, p99Index)],
      mean: sum / count,
      count,
      min: sorted[0],
      max: sorted[count - 1],
    };
  }

  /**
   * Get current latency statistics
   */
  getStats(operation?: string): LatencyStats {
    let measurements = this.measurements;

    if (operation) {
      measurements = measurements.filter((m) => m.operation === operation);
    }

    const durations = measurements.map((m) => m.duration);
    return this.calculatePercentiles(durations);
  }

  /**
   * Write current measurements to daily log file
   */
  async flushToFile() {
    if (this.measurements.length === 0) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `metrics-${today}.jsonl`;
      const filepath = join(this.logDir, filename);

      // Group by operation and calculate stats
      const operations = [
        ...new Set(this.measurements.map((m) => m.operation)),
      ];
      const logEntry = {
        timestamp: new Date().toISOString(),
        date: today,
        operations: operations.map((op) => {
          const opMeasurements = this.measurements.filter(
            (m) => m.operation === op,
          );
          const durations = opMeasurements.map((m) => m.duration);
          const stats = this.calculatePercentiles(durations);

          return {
            operation: op,
            ...stats,
          };
        }),
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(filepath, logLine);

      console.log(`Latency metrics written to ${filepath}`);
    } catch (error) {
      console.error('Failed to write latency metrics:', error);
    }
  }

  /**
   * Clear current measurements (called after flushing)
   */
  clear() {
    this.measurements = [];
  }
}

// Global instance
const latencyLogger = new LatencyLogger();

/**
 * Decorator function to measure latency of async operations
 */
export function measureLatency<
  T extends (...args: unknown[]) => Promise<unknown>,
>(operation: string, fn: T, metadata?: Record<string, unknown>): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      latencyLogger.record(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      latencyLogger.record(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }) as T;
}

/**
 * Sync version of latency measurement
 */
export function measureLatencySync<T extends (...args: unknown[]) => unknown>(
  operation: string,
  fn: T,
  metadata?: Record<string, unknown>,
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = fn(...args);
      const duration = performance.now() - start;
      latencyLogger.record(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      latencyLogger.record(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }) as T;
}

/**
 * Manual latency recording
 */
export function recordLatency(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>,
) {
  latencyLogger.record(operation, duration, metadata);
}

/**
 * Get current latency statistics
 */
export function getLatencyStats(operation?: string): LatencyStats {
  return latencyLogger.getStats(operation);
}

/**
 * Flush metrics to file and clear memory
 */
export async function flushLatencyMetrics() {
  await latencyLogger.flushToFile();
  latencyLogger.clear();
}

/**
 * Start automatic flushing every hour
 */
export function startLatencyLogger() {
  // Flush every hour
  setInterval(
    async () => {
      await flushLatencyMetrics();
    },
    60 * 60 * 1000,
  );

  // Also flush on process exit
  process.on('SIGINT', async () => {
    await flushLatencyMetrics();
    process.exit(0);
  });

  console.log(
    'Latency logger started - metrics will be written to logs/metrics/',
  );
}

/**
 * Test function for soak testing at 100 rps
 */
export async function runLatencySoakTest(durationMs = 10000) {
  console.log(`Starting latency soak test for ${durationMs}ms...`);

  const startTime = Date.now();
  let requestCount = 0;

  const testOperation = async () => {
    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));
    requestCount++;
  };

  const measuredOperation = measureLatency('soak_test', testOperation);

  // Run at approximately 100 rps
  const interval = setInterval(async () => {
    if (Date.now() - startTime >= durationMs) {
      clearInterval(interval);

      const stats = getLatencyStats('soak_test');
      console.log('Soak test completed:', {
        duration: durationMs,
        requests: requestCount,
        rps: requestCount / (durationMs / 1000),
        stats,
      });

      await flushLatencyMetrics();
      return;
    }

    await measuredOperation();
  }, 10); // ~100 rps
}
