import React, { useMemo } from 'react';
import UnifiedPanel from '../UnifiedPanel.js';
import ModernLiveOutput from '../ModernLiveOutput.js';
import { useJobStore } from '../../store/jobStore.js';
import { useJobStreaming } from '../../hooks/useJobStreaming.js';
import {
  countTokens,
  estimateCompletionTokens,
  estimateCost,
} from '../../utils/tokenCounter.js';

interface PromptWorkspaceProps {
  template: string;
  inputData: string;
  provider: string;
  model: string;
  onTemplateChange: (template: string) => void;
  onInputDataChange: (inputData: string) => void;
  onStartWithExample: () => void;
  isEmptyState: boolean;
}

/**
 * PromptWorkspace component encapsulates the core interactive area of the application
 * including the UnifiedPanel and ModernLiveOutput sections with their related logic
 */
const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({
  template,
  inputData,
  provider,
  model,
  onTemplateChange,
  onInputDataChange,
  onStartWithExample,
  isEmptyState,
}) => {
  const {
    log,
    metrics,
    temperature,
    topP,
    maxTokens,
    selectedMetrics,
  } = useJobStore();

  const {
    outputText,
    streamStatus,
    isExecuting,
    executeJob,
  } = useJobStreaming();

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

  const handleRun = async () => {
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
  };

  return (
    <section
      className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 sm:p-6 items-start min-h-0 w-full max-w-full"
      aria-label="Prompt evaluation workspace"
    >
      {/* Left Column - Unified Input & Results Panel */}
      <div className="w-full lg:w-2/5 lg:max-w-[40%] flex-shrink-0 min-w-0">
        <UnifiedPanel
          template={template}
          inputData={inputData}
          onTemplateChange={onTemplateChange}
          onInputDataChange={onInputDataChange}
          model={model}
          onStartWithExample={onStartWithExample}
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
                <div
                  className="text-muted-foreground mb-4"
                  aria-hidden="true"
                >
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
  );
};

export default PromptWorkspace;
