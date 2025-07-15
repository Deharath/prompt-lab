import { useJobExecution } from './useJobExecution.js';

export interface JobStreamingState {
  outputText: string;
  streamStatus: 'streaming' | 'complete' | 'error';
  error: string | null;
  isExecuting: boolean;
  isStreaming: boolean;
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
  cancelJob: () => Promise<void>;
  reset: () => void;
}

export const useJobStreaming = () => {
  // Simple re-export of the new unified hook for backward compatibility
  const {
    outputText,
    streamStatus,
    error,
    isExecuting,
    isStreaming,
    executeJob,
    cancelJob,
    reset,
  } = useJobExecution();

  return {
    outputText,
    streamStatus,
    error,
    isExecuting,
    isStreaming,
    executeJob,
    cancelJob,
    reset,
  };
};
