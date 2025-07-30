import { QueryClient } from '@tanstack/react-query';
import { ApiClient } from '../api.js';
import { batchUpdateJobsCache } from '../utils/cacheUtils.js';
import { logger } from '../utils/logger.js';
import type { JobSummary } from '../api.js';

export class JobService {
  constructor(private queryClient: QueryClient) {}

  async executeJob(params: {
    template: string;
    inputData: string;
    provider: string;
    model: string;
    temperature: number;
    topP: number;
    maxTokens: number;
    disabledMetrics: string[];
  }): Promise<JobSummary> {
    logger.info('Starting job execution', {
      provider: params.provider,
      model: params.model,
    });

    try {
      const finalPrompt = this.buildFinalPrompt(
        params.template,
        params.inputData,
      );

      const job = await ApiClient.createJob({
        prompt: finalPrompt,
        template: params.template,
        inputData: params.inputData,
        provider: params.provider,
        model: params.model,
        temperature: params.temperature,
        topP: params.topP,
        maxTokens: params.maxTokens > 0 ? params.maxTokens : undefined,
        disabledMetrics: params.disabledMetrics,
      });

      this.queryClient.setQueryData(['jobs'], (oldJobs: JobSummary[] = []) => {
        return [job, ...oldJobs];
      });

      logger.info('Job created successfully', { jobId: job.id });
      return job;
    } catch (error) {
      logger.error('Job execution failed', { error, params });
      throw error;
    }
  }

  private buildFinalPrompt(template: string, inputData: string): string {
    let finalPrompt = template;

    try {
      const inputs = JSON.parse(inputData);
      if (inputs && typeof inputs === 'object') {
        for (const key in inputs) {
          finalPrompt = finalPrompt.replace(
            new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
            String(inputs[key]),
          );
        }
      }
    } catch {
      // If inputData is not valid JSON, treat as plain text
    }

    return finalPrompt.replace(/\{\{\s*input\s*\}\}/g, inputData);
  }

  async cancelJob(jobId: string): Promise<void> {
    await ApiClient.cancelJob(jobId);

    batchUpdateJobsCache(this.queryClient, [
      { id: jobId, status: 'cancelled' },
    ]);
  }
}
