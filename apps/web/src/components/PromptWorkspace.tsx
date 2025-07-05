import React, { useState, useEffect, useMemo, useCallback } from 'react';
import UnifiedPanel from './UnifiedPanel.js';
import ModernLiveOutput from './ModernLiveOutput.js';
import ErrorAlert from './ui/ErrorAlert.js';
import { useJobStore } from '../store/jobStore.js';
import { useJobStreaming } from '../hooks/useJobStreaming.js';
import { ApiClient } from '../api.js';
import { SAMPLE_PROMPT, SAMPLE_INPUT } from '../constants/app.js';
import {
  countTokens,
  estimateCompletionTokens,
  estimateCost,
} from '../utils/tokenCounter.js';

interface PromptWorkspaceProps {
  onJobSelect?: (jobId: string) => void;
  onStateChange?: (state: {
    template: string;
    inputData: string;
    provider: string;
    model: string;
    promptTokens: number;
    estimatedCompletionTokens: number;
    totalTokens: number;
    estimatedCost: number;
    canRunEvaluation: boolean;
    handleJobSelect: (jobId: string) => Promise<void>;
    handleRun: () => Promise<void>;
    setProvider: (provider: string) => void;
    setModel: (model: string) => void;
    setTemplate: (template: string) => void;
  }) => void;
}

/**
 * PromptWorkspace component encapsulates the core interactive area of the application
 * including the UnifiedPanel and ModernLiveOutput sections with their related logic
 */
const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({
  onJobSelect,
  onStateChange,
}) => {
  // Internal state management - moved from Home.tsx
  const [template, setTemplateState] = useState('');
  const [inputData, setInputDataState] = useState('');
  const [provider, setProviderState] = useState('openai');
  const [model, setModelState] = useState('gpt-4o-mini');

  // Create stable setter functions
  const setTemplate = useCallback((value: string) => setTemplateState(value), []);
  const setInputData = useCallback((value: string) => setInputDataState(value), []);
  const setProvider = useCallback((value: string) => setProviderState(value), []);
  const setModel = useCallback((value: string) => setModelState(value), []);

  const { log, metrics, temperature, topP, maxTokens, selectedMetrics, hasUserData, setUserData } =
    useJobStore();

  // Update user data state
  useEffect(() => {
    setUserData(!!(template || inputData));
  }, [template, inputData, setUserData]);

  const { outputText, streamStatus, isExecuting, executeJob, error } =
    useJobStreaming();

  // Sync outputText with job store log for Bug #7 fix
  const displayOutputText =
    log.length > 0 ? log.map((l) => l.text).join('') : outputText;

  // Calculate live token counts and cost estimates
  const promptTokens = useMemo(() => {
    if (!template || !inputData) return 0;
    // Build the final prompt by replacing {{input}} with actual input data
    const finalPrompt = template.replace(/\{\{\s*input\s*\}\}/g, inputData);
    return countTokens(finalPrompt, model);
  }, [template, inputData, model]);

  const estimatedCompletionTokens = useMemo(() => {
    if (!template || !inputData) return 0;
    const finalPrompt = template.replace(/\{\{\s*input\s*\}\}/g, inputData);
    return estimateCompletionTokens(finalPrompt, model);
  }, [template, inputData, model]);

  const estimatedCost = useMemo(() => {
    if (!promptTokens) return 0;
    return estimateCost(promptTokens, estimatedCompletionTokens, model);
  }, [promptTokens, estimatedCompletionTokens]);

  const handleRun = useCallback(async () => {
    await executeJob({
      template,
      inputData,
      provider,
      model,
      temperature,
      topP,
      maxTokens,
      selectedMetrics,
    });
  }, [executeJob, template, inputData, provider, model, temperature, topP, maxTokens, selectedMetrics]);

  const handleStartWithExample = useCallback(() => {
    setTemplate(SAMPLE_PROMPT);
    setInputData(SAMPLE_INPUT);
  }, []);

  const handleJobSelect = useCallback(async (jobId: string) => {
    try {
      // Fetch the job details to get the template and input data
      const jobDetails = await ApiClient.fetchJob(jobId);

      // Load the job's template and input data if available
      if (jobDetails.template && jobDetails.inputData) {
        // Use the stored template and input data directly
        setTemplate(jobDetails.template);
        setInputData(jobDetails.inputData);
      } else if (jobDetails.prompt) {
        // Fallback: if template/input not stored, use the prompt as template
        setTemplate(jobDetails.prompt);
        setInputData('');
      }

      // Update the provider and model to match the job
      setProvider(jobDetails.provider);
      setModel(jobDetails.model);

      // Notify parent component if callback provided
      if (onJobSelect) {
        onJobSelect(jobId);
      }
    } catch (error) {
      console.error('Failed to load job details:', error);
    }
  }, [onJobSelect]);

  const isEmptyState = !template && !inputData && !hasUserData;

  // Notify parent component of state changes
  useEffect(() => {
    if (onStateChange) {
      const totalTokens = promptTokens + estimatedCompletionTokens;
      onStateChange({
        template,
        inputData,
        provider,
        model,
        promptTokens,
        estimatedCompletionTokens,
        totalTokens,
        estimatedCost,
        canRunEvaluation: !!(template && inputData),
        handleJobSelect,
        handleRun,
        setProvider,
        setModel,
        setTemplate,
      });
    }
  }, [template, inputData, provider, model, promptTokens, estimatedCompletionTokens, estimatedCost, onStateChange]);

  return (
    <>
      {/* Error Alert */}
      {error && (
        <div className="p-4 sm:p-6 pb-0" role="alert" aria-live="polite">
          <ErrorAlert error={error} />
        </div>
      )}
      
      <section
        className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 sm:p-6 items-start min-h-0 w-full max-w-full"
        aria-label="Prompt evaluation workspace"
      >
      {/* Left Column - Unified Input & Results Panel */}
      <div className="w-full lg:w-2/5 lg:max-w-[40%] flex-shrink-0 min-w-0">
        <UnifiedPanel
          template={template}
          inputData={inputData}
          onTemplateChange={setTemplate}
          onInputDataChange={setInputData}
          model={model}
          onStartWithExample={handleStartWithExample}
          isEmptyState={isEmptyState}
          metrics={metrics}
          hasResults={!!(metrics && Object.keys(metrics).length > 0)}
        />
      </div>

      {/* Right Column - Modern Live Output */}
      <div className="w-full lg:w-3/5 lg:max-w-[60%] space-y-4 sm:space-y-6 min-w-0">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 h-[600px]">
            {displayOutputText || streamStatus === 'streaming' ? (
              <ModernLiveOutput
                outputText={displayOutputText}
                status={streamStatus}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-muted-foreground mb-4" aria-hidden="true">
                  <svg
                    className="h-16 w-16 mx-auto mb-4 opacity-60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ready to stream
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default PromptWorkspace;

// Export getter functions for parent components that need access to state
export const usePromptWorkspaceState = () => {
  // This is a utility hook that could be used by Home.tsx if needed
  // Currently not used but provides access pattern for future needs
  return null;
};
