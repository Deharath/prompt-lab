import React, {
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import UnifiedPanel from './UnifiedPanel.js';
import ModernLiveOutput from '../evaluation/ModernLiveOutput.js';
import ErrorAlert from '../../ui/ErrorAlert.js';
import { useJobStore } from '../../../store/jobStore.js';
import { useWorkspaceStore } from '../../../store/workspaceStore.js';
import { useJobStreaming } from '../../../hooks/useJobStreaming.js';
import { useStateSynchronization } from '../../../hooks/useStateSynchronization.js';

interface PromptWorkspaceProps {
  onJobSelect?: (jobId: string) => void;
}

export interface PromptWorkspaceRef {
  handleRun: () => Promise<void>;
}

/**
 * PromptWorkspace component encapsulates the core interactive area of the application
 * including the UnifiedPanel and ModernLiveOutput sections with their related logic
 */
const PromptWorkspace = forwardRef<PromptWorkspaceRef, PromptWorkspaceProps>(
  ({ onJobSelect }, ref) => {
    // Initialize state synchronization
    useStateSynchronization();

    // Get workspace data from store
    const {
      template,
      inputData,
      provider,
      model,
      setTemplate,
      setInputData,
      startWithExample,
      loadJobData,
    } = useWorkspaceStore();

    const isEmptyState = !template && !inputData;

    const {
      current,
      log,
      metrics,
      temperature,
      topP,
      maxTokens,
      disabledMetrics,
      hasUserData,
      setUserData,
    } = useJobStore();

    // Update user data state
    useEffect(() => {
      setUserData(!!(template || inputData));
    }, [template, inputData, setUserData]);

    const {
      outputText,
      streamStatus,
      isExecuting,
      executeJob,
      error,
      reset: resetStreaming,
    } = useJobStreaming();

    // Create unified output data source
    const unifiedOutput = useMemo(() => {
      // Priority 1: If actively executing/streaming, use live output
      if (isExecuting || streamStatus === 'streaming') {
        return outputText;
      }

      // Priority 2: If we have historical log data, use it
      if (log && log.length > 0) {
        return log.map((entry) => entry.text).join('');
      }

      // Priority 3: If we have streaming output (completed job), use it
      if (outputText) {
        return outputText;
      }

      // No output available
      return '';
    }, [outputText, streamStatus, isExecuting, log]);

    // Determine the appropriate stream status for display
    const unifiedStreamStatus = useMemo(() => {
      // If actively executing, use the real stream status
      if (isExecuting) {
        return streamStatus;
      }

      // If we have historical data or completed streaming output, mark as complete
      if (unifiedOutput) {
        return 'complete' as const;
      }

      // No output, use current stream status
      return streamStatus;
    }, [isExecuting, streamStatus, unifiedOutput]);

    const handleRun = async () => {
      await executeJob({
        template,
        inputData,
        provider,
        model,
        temperature,
        topP,
        maxTokens,
        disabledMetrics,
      });
    };

    // Expose handleRun method to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        handleRun,
      }),
      [handleRun],
    );

    const handleJobSelect = async (jobId: string) => {
      try {
        // Clear any active execution state before loading historical job
        resetStreaming();

        await loadJobData(jobId);

        // Notify parent component if callback provided
        if (onJobSelect) {
          onJobSelect(jobId);
        }
      } catch (error) {
        // Job details loading error handled by user notification
      }
    };

    return (
      <>
        {/* Error Alert */}
        {error && (
          <div className="p-4 pb-0 sm:p-6" role="alert" aria-live="polite">
            <ErrorAlert error={error} />
          </div>
        )}

        <section
          className="flex min-h-0 w-full max-w-full flex-col items-start gap-4 p-3 sm:gap-6 sm:p-6 lg:flex-row lg:gap-8"
          aria-label="Prompt evaluation workspace"
        >
          {/* Left Column - Unified Input & Results Panel */}
          <div className="w-full min-w-0 flex-shrink-0 lg:w-2/5 lg:max-w-[40%]">
            <UnifiedPanel
              template={template}
              inputData={inputData}
              onTemplateChange={setTemplate}
              onInputDataChange={setInputData}
              model={model}
              onStartWithExample={startWithExample}
              isEmptyState={isEmptyState}
              metrics={metrics}
              hasResults={
                metrics !== undefined &&
                metrics !== null &&
                Object.keys(metrics || {}).length > 0
              }
              currentJob={current}
            />
          </div>

          {/* Right Column - Modern Live Output */}
          <div className="w-full min-w-0 space-y-3 sm:space-y-6 lg:w-3/5 lg:max-w-[60%]">
            <div className="bg-card border-border flex h-fit touch-pan-y flex-col overflow-hidden rounded-xl border shadow-sm">
              <div
                className="flex flex-col p-3 sm:p-6"
                style={{
                  height:
                    unifiedOutput || unifiedStreamStatus === 'streaming'
                      ? '100%'
                      : 'auto',
                }}
              >
                {unifiedOutput || unifiedStreamStatus === 'streaming' ? (
                  <ModernLiveOutput
                    outputText={unifiedOutput}
                    status={unifiedStreamStatus}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div
                      className="text-muted-foreground mb-4"
                      aria-hidden="true"
                    >
                      <svg
                        className="mx-auto mb-4 h-16 w-16 opacity-60"
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
                    <h3 className="text-foreground mb-2 text-lg font-semibold">
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
  },
);

PromptWorkspace.displayName = 'PromptWorkspace';

export default PromptWorkspace;
