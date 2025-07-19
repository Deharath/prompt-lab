import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJobStore } from '../store/jobStore.js';
import { ApiClient } from '../api.js';
import { addJobToCache, batchUpdateJobsCache } from '../utils/cacheUtils.js';
import { generateResultSnippet } from '../utils/logger.js';
import type { JobSummary } from '../api.js';

export interface JobExecutionParams {
  template: string;
  inputData: string;
  provider: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  selectedMetrics: any[];
}

export interface JobExecutionState {
  currentJob: JobSummary | null;
  outputText: string;
  isExecuting: boolean;
  isStreaming: boolean;
  error: string | null;
  streamStatus: 'streaming' | 'complete' | 'error';
}

export interface JobExecutionActions {
  executeJob: (params: JobExecutionParams) => Promise<void>;
  cancelJob: () => Promise<void>;
  reset: () => void;
}

export const useJobExecution = (): JobExecutionState & JobExecutionActions => {
  // Local state for UI-specific data
  const [currentJob, setCurrentJob] = useState<JobSummary | null>(null);
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const queryClient = useQueryClient();
  // Use shared execution state from job store
  const {
    current: storeCurrentJob,
    isExecuting,
    isStreaming,
    start,
    finish,
    reset: resetJobStore,
    setIsExecuting,
    setIsStreaming,
  } = useJobStore();

  // Derive stream status from state
  const streamStatus: 'streaming' | 'complete' | 'error' = error
    ? 'error'
    : isStreaming
      ? 'streaming'
      : 'complete';

  const executeJob = useCallback(
    async (params: JobExecutionParams) => {
      setError(null);
      setIsExecuting(true);
      setIsStreaming(false);
      setOutputText('');

      try {
        // Reset job store
        resetJobStore();

        // Create job
        const {
          template,
          inputData,
          provider,
          model,
          temperature,
          topP,
          maxTokens,
          selectedMetrics,
        } = params;

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
          // If inputData is not valid JSON, treat it as plain text
        }
        finalPrompt = finalPrompt.replace(/\{\{\s*input\s*\}\}/g, inputData);

        const metricsToSend =
          selectedMetrics.length > 0 ? selectedMetrics : undefined;

        const job = await ApiClient.createJob({
          prompt: finalPrompt,
          template,
          inputData,
          provider,
          model,
          temperature,
          topP,
          maxTokens: maxTokens > 0 ? maxTokens : undefined,
          metrics: metricsToSend,
        });

        // Set current job and start in store
        setCurrentJob(job);
        start(job);
        addJobToCache(queryClient, job);

        // Start streaming
        setIsStreaming(true);

        let fullText = '';
        let metricsReceived = false;
        let cancelled = false;

        const stream = ApiClient.streamJob(
          job.id,
          // On token received
          (token) => {
            if (cancelled) return;

            fullText += token;
            // Direct, synchronous React state update
            setOutputText(fullText);

            // Update cache to show running status
            if (fullText.length === token.length) {
              batchUpdateJobsCache(queryClient, [
                { id: job.id, status: 'running' },
              ]);
            }
          },
          // On stream complete
          async () => {
            if (cancelled) return;

            setIsStreaming(false);
            // Keep isExecuting true until all completion work is done

            // Generate snippet synchronously from current output
            const resultSnippet = fullText
              ? generateResultSnippet(fullText)
              : null;

            // Update cache with completion
            batchUpdateJobsCache(queryClient, [
              { id: job.id, status: 'completed', resultSnippet },
            ]);

            // Wait for final job data
            try {
              let attempts = 0;
              let finalJob;

              while (attempts < 10) {
                await new Promise((resolve) =>
                  setTimeout(
                    resolve,
                    Math.min(100 * Math.pow(1.5, attempts), 500),
                  ),
                );
                finalJob = await ApiClient.fetchJob(job.id);

                if (
                  finalJob.status === 'completed' ||
                  finalJob.status === 'failed'
                ) {
                  break;
                }
                attempts++;
              }

              if (finalJob && !metricsReceived) {
                finish(finalJob.metrics || {});
              }

              if (finalJob) {
                batchUpdateJobsCache(queryClient, [
                  {
                    id: job.id,
                    status: finalJob.status,
                    costUsd: finalJob.costUsd,
                    resultSnippet: finalJob.result
                      ? generateResultSnippet(finalJob.result)
                      : resultSnippet,
                  },
                ]);
              }
            } catch (err) {
              console.error('Failed to fetch final job status:', err);
              batchUpdateJobsCache(queryClient, [
                { id: job.id, status: 'failed' },
              ]);
            }

            // Clear current job and set execution to false ONLY after everything is done
            setCurrentJob(null);
            setIsExecuting(false);
          },
          // On stream error
          (streamError) => {
            if (cancelled) return;

            setIsStreaming(false);
            setIsExecuting(false);
            setError(`Stream error: ${streamError.message}`);

            batchUpdateJobsCache(queryClient, [
              { id: job.id, status: 'failed' },
            ]);

            setCurrentJob(null);
          },
          // On metrics received
          (metrics) => {
            if (cancelled) return;

            metricsReceived = true;
            finish(metrics || {});

            batchUpdateJobsCache(queryClient, [
              { id: job.id, status: 'completed' },
            ]);
          },
          // On status update
          (status) => {
            if (cancelled) return;

            batchUpdateJobsCache(queryClient, [
              { id: job.id, status: status as any },
            ]);
          },
          // On cancellation
          (message) => {
            cancelled = true;
            setIsStreaming(false);
            setIsExecuting(false);

            // Generate snippet from current output
            const resultSnippet = fullText
              ? generateResultSnippet(fullText)
              : null;

            batchUpdateJobsCache(queryClient, [
              { id: job.id, status: 'cancelled', resultSnippet },
            ]);

            setCurrentJob(null);
          },
        );

        setEventSource(stream);
      } catch (err) {
        setIsExecuting(false);
        setIsStreaming(false);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to execute job';
        setError(errorMessage);
        setCurrentJob(null);
      }
    },
    [queryClient, start, finish, resetJobStore],
  );

  const cancelJob = useCallback(async () => {
    // Use currentJob from local state first, then fall back to store's current job
    const jobToCancel = currentJob || storeCurrentJob;

    if (!jobToCancel) {
      console.warn(
        'No job to cancel - both currentJob and storeCurrentJob are null',
      );
      return;
    }

    try {
      console.log('Cancelling job:', jobToCancel.id);
      await ApiClient.cancelJob(jobToCancel.id);

      // Close event source if it exists
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }

      // Update cache
      batchUpdateJobsCache(queryClient, [
        { id: jobToCancel.id, status: 'cancelled' },
      ]);

      // Clear state immediately
      setCurrentJob(null);
      setIsExecuting(false);
      setIsStreaming(false);
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  }, [currentJob, storeCurrentJob, eventSource, queryClient]);

  const reset = useCallback(() => {
    setCurrentJob(null);
    setOutputText('');
    setError(null);

    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }

    resetJobStore(); // This will reset isExecuting and isStreaming
  }, [eventSource, resetJobStore]);

  return {
    currentJob,
    outputText,
    isExecuting,
    isStreaming,
    error,
    streamStatus,
    executeJob,
    cancelJob,
    reset,
  };
};
