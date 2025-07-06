import { useState, useRef, useEffect } from 'react';
import { ApiClient } from '../api.js';
import { useJobStore } from '../store/jobStore.js';

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
  cancelStream: () => void;
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
      for (const key in inputs) {
        finalPrompt = finalPrompt.replace(
          new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
          inputs[key],
        );
      }
    } catch (e) {
      // ignore json parsing errors
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

      start(job);
      let fullText = '';

      // Store the new EventSource reference for future cancellation
      const eventSource = ApiClient.streamJob(
        job.id,
        (token) => {
          fullText += token;
          setOutputText(fullText);
        },
        async () => {
          setStreamStatus('complete');
          setIsExecuting(false);
          currentEventSourceRef.current = null;
          try {
            const final = await ApiClient.fetchJob(job.id);
            finish((final.metrics as Record<string, unknown>) || {});
          } catch (_err) {
            finish({});
          }
        },
        (streamError) => {
          setStreamStatus('error');
          setIsExecuting(false);
          currentEventSourceRef.current = null;
          setError(`Stream error: ${streamError.message}`);
        },
        (metrics) => {
          // Don't cast to Record<string, number> as metrics can include complex objects
          finish(metrics || {});
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

  const cancelStream = () => {
    closeCurrentStream();
    setStreamStatus('complete');
    setIsExecuting(false);
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
