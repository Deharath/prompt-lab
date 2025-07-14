import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../api.js';
import { useJobStore } from '../store/jobStore.js';
import type { JobSummary } from '../api.js';

export interface JobStreamingState {
  outputText: string;
  streamStatus: 'streaming' | 'complete' | 'error';
  error: string | null;
  isExecuting: boolean;
}

export interface JobStreamingActions {
  executeJob: (params: {
    template: string;
    inputData: string;
    provider: string;
    model: string;
    temperature: number;
    topP: number;
    maxTokens: number;
    selectedMetrics: any[];
  }) => Promise<void>;
  reset: () => void;
  cancelStream: (jobId?: string) => Promise<void>;
}

export const useJobStreaming = (): JobStreamingState & JobStreamingActions => {
  const [outputText, setOutputText] = useState('');
  const [streamStatus, setStreamStatus] = useState<
    'streaming' | 'complete' | 'error'
  >('complete');
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Track the current EventSource to allow cancellation
  const currentEventSourceRef = useRef<EventSource | null>(null);

  const { start, finish, reset: resetJobStore } = useJobStore();
  const queryClient = useQueryClient();

  // Cleanup function to close any active EventSource
  const closeCurrentStream = () => {
    if (currentEventSourceRef.current) {
      currentEventSourceRef.current.close();
      currentEventSourceRef.current = null;
    }
    setIsExecuting(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeCurrentStream();
    };
  }, []);

  const executeJob = async (params: {
    template: string;
    inputData: string;
    provider: string;
    model: string;
    temperature: number;
    topP: number;
    maxTokens: number;
    selectedMetrics: any[];
  }) => {
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

    // Close any existing stream before starting a new one
    closeCurrentStream();

    setError(null);
    setOutputText('');
    setStreamStatus('streaming');
    setIsExecuting(true);

    // Build the final prompt by replacing {{key}} with actual input data
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
      // This is expected for simple text inputs
    }
    finalPrompt = finalPrompt.replace(/\{\{\s*input\s*\}\}/g, inputData);

    try {
      resetJobStore();

      // Send the full selectedMetrics array with IDs and input data
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
        maxTokens: maxTokens > 0 ? maxTokens : undefined, // Only send if > 0
        metrics: metricsToSend, // Send full metric objects with potential input data
      });

      // Immediately add the new job to the history cache for instant UI feedback
      queryClient.setQueryData(
        ['jobs'],
        (oldJobs: JobSummary[] | undefined) => {
          const updatedJobs = oldJobs ? [...oldJobs] : [];
          // Add the new job at the beginning (most recent first)
          updatedJobs.unshift(job);
          return updatedJobs;
        },
      );

      start(job);
      let fullText = '';
      let metricsReceived = false;

      // Store the new EventSource reference for future cancellation
      const eventSource = ApiClient.streamJob(
        job.id,
        (token) => {
          // Update job status to 'running' when first token arrives
          if (fullText === '') {
            queryClient.setQueryData(
              ['jobs'],
              (oldJobs: JobSummary[] | undefined) => {
                if (!oldJobs) return oldJobs;
                return oldJobs.map((j) =>
                  j.id === job.id ? { ...j, status: 'running' as const } : j,
                );
              },
            );
          }
          fullText += token;
          setOutputText(fullText);
        },
        async () => {
          setStreamStatus('complete');
          setIsExecuting(false);
          currentEventSourceRef.current = null;

          try {
            // Poll for job completion with exponential backoff
            let attempts = 0;
            let final;

            while (attempts < 10) {
              // Max 10 attempts (~3 seconds total)
              await new Promise((resolve) =>
                setTimeout(
                  resolve,
                  Math.min(100 * Math.pow(1.5, attempts), 500),
                ),
              );
              final = await ApiClient.fetchJob(job.id);

              if (final.status === 'completed' || final.status === 'failed') {
                break;
              }
              attempts++;
            }

            // Only set metrics if we haven't received them via the metrics event
            if (!metricsReceived && final) {
              finish((final.metrics as Record<string, unknown>) || {});
            }

            // Update job status in history cache to final status
            if (final) {
              queryClient.setQueryData(
                ['jobs'],
                (oldJobs: JobSummary[] | undefined) => {
                  if (!oldJobs) return oldJobs;
                  return oldJobs.map((j) =>
                    j.id === job.id
                      ? {
                          ...j,
                          status: final.status,
                          costUsd: final.costUsd,
                          // Add a result snippet for preview
                          resultSnippet: final.result
                            ? final.result.substring(0, 100) + '...'
                            : null,
                        }
                      : j,
                  );
                },
              );
            }
          } catch (_err) {
            if (!metricsReceived) {
              finish({});
            }
            // Update job status to failed in history cache
            queryClient.setQueryData(
              ['jobs'],
              (oldJobs: JobSummary[] | undefined) => {
                if (!oldJobs) return oldJobs;
                return oldJobs.map((j) =>
                  j.id === job.id ? { ...j, status: 'failed' as const } : j,
                );
              },
            );
          }
        },
        (streamError) => {
          setStreamStatus('error');
          setIsExecuting(false);
          currentEventSourceRef.current = null;
          setError(`Stream error: ${streamError.message}`);

          // Update job status to failed in history cache
          queryClient.setQueryData(
            ['jobs'],
            (oldJobs: JobSummary[] | undefined) => {
              if (!oldJobs) return oldJobs;
              return oldJobs.map((j) =>
                j.id === job.id ? { ...j, status: 'failed' as const } : j,
              );
            },
          );
        },
        (metrics) => {
          // Don't cast to Record<string, number> as metrics can include complex objects
          metricsReceived = true;
          finish(metrics || {});

          // Update job status to completed when metrics are received
          queryClient.setQueryData(
            ['jobs'],
            (oldJobs: JobSummary[] | undefined) => {
              if (!oldJobs) return oldJobs;
              return oldJobs.map((j) =>
                j.id === job.id ? { ...j, status: 'completed' as const } : j,
              );
            },
          );
        },
        // NEW: Status update handler
        (status) => {
          queryClient.setQueryData(
            ['jobs'],
            (oldJobs: JobSummary[] | undefined) => {
              if (!oldJobs) return oldJobs;
              return oldJobs.map((j) =>
                j.id === job.id ? { ...j, status: status as any } : j,
              );
            },
          );
        },
        // NEW: Cancelled handler
        (message) => {
          setStreamStatus('complete');
          setIsExecuting(false);
          currentEventSourceRef.current = null;

          queryClient.setQueryData(
            ['jobs'],
            (oldJobs: JobSummary[] | undefined) => {
              if (!oldJobs) return oldJobs;
              return oldJobs.map((j) =>
                j.id === job.id ? { ...j, status: 'cancelled' as const } : j,
              );
            },
          );
        },
      );

      currentEventSourceRef.current = eventSource;
    } catch (err) {
      setStreamStatus('error');
      setIsExecuting(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to run';
      setError(errorMessage);
    }
  };

  const reset = () => {
    closeCurrentStream();
    setOutputText('');
    setStreamStatus('complete');
    setError(null);
    setIsExecuting(false);
    resetJobStore();
  };

  const cancelStream = async (jobId?: string) => {
    closeCurrentStream();
    setStreamStatus('complete');
    setIsExecuting(false);

    // If jobId is provided, also cancel the job on the backend
    if (jobId) {
      try {
        await ApiClient.cancelJob(jobId);
        // Update the job in query cache to cancelled status
        queryClient.setQueryData(
          ['jobs'],
          (oldJobs: JobSummary[] | undefined) => {
            if (!oldJobs) return oldJobs;
            return oldJobs.map((j) =>
              j.id === jobId ? { ...j, status: 'cancelled' as const } : j,
            );
          },
        );
      } catch (error) {
        console.error('Failed to cancel job on backend:', error);
      }
    }

    // Update job store running state to false without clearing metrics
    // Never clear metrics on cancellation - preserve existing metrics
    useJobStore.setState({ running: false });
  };

  return {
    outputText,
    streamStatus,
    error,
    isExecuting,
    executeJob,
    reset,
    cancelStream,
  };
};
