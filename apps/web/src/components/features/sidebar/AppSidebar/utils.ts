import { format } from 'date-fns';
import type { JobSummary } from './types.js';

/**
 * Utility functions for the AppSidebar component
 *
 * These helper functions provide consistent formatting and display logic
 * for job items in the history tab.
 */

/**
 * Generates a readable label for a job with status, ID, and model info
 *
 * @param job - The job summary to generate a label for
 * @returns A formatted string like "✓ #12345678 • openai/gpt-4o-mini"
 */
export const getReadableLabel = (job: JobSummary): string => {
  // Enhanced readability with clear prompt preview
  const identifier = `#${job.id.substring(0, 8)}`;
  const modelInfo = `${job.provider}/${job.model}`;

  // Add status context for better identification
  const statusInfo =
    job.status === 'completed'
      ? '✓'
      : job.status === 'failed'
        ? '✗'
        : job.status === 'running'
          ? '⏳'
          : '⏸';

  return `${statusInfo} ${identifier} • ${modelInfo}`;
};

/**
 * Formats a job's creation timestamp in a human-readable format
 *
 * @param job - The job summary to format the timestamp for
 * @returns A formatted timestamp like "Jan 15 · 14:30"
 */
export const getFormattedTimestamp = (job: JobSummary): string => {
  return format(job.createdAt, 'MMM d · HH:mm');
};
