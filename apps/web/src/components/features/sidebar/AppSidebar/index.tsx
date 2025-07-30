import React, { memo } from 'react';
import { useAppSidebar } from './useAppSidebar.js';
import SidebarHeader from './SidebarHeader.js';
import HistoryTab from './HistoryTab.js';
import ConfigurationTab from './ConfigurationTab.js';
import CustomPrompt from '../CustomPrompt.js';
import CollapsedSidebar from './CollapsedSidebar.js';

import RunEvaluationFooter from './RunEvaluationFooter.js';
import type { AppSidebarProps } from './types.js';

/**
 * AppSidebar - A unified sidebar component with three tabs: History, Configuration, and Custom
 *
 * This is the main sidebar component that provides:
 * - History tab: Job history and comparison functionality
 * - Configuration tab: Model and evaluation configuration
 * - Custom tab: Custom prompt templates
 *
 * The sidebar can be collapsed and includes proper keyboard navigation and accessibility features.
 */
const AppSidebar = memo<AppSidebarProps>(
  ({
    isCollapsed,
    onToggle,
    onSelectJob,
    onCompareJobs,
    provider,
    model,
    onProviderChange,
    onModelChange,
    onLoadTemplate,
    onRunEvaluation,
    onCancelEvaluation,
    canRunEvaluation = false,
    isRunning = false,
    promptTokens = 0,
    estimatedCompletionTokens = 0,
    totalTokens = 0,
    estimatedCost = 0,
    template = '',
    inputData = '',
  }) => {
    const sidebarState = useAppSidebar(
      isCollapsed,
      onSelectJob || (() => {}),
      onCompareJobs || (() => {}),
      isRunning, // Pass isRunning prop to useAppSidebar
    );

    // Destructure state for cleaner JSX
    const {
      // State
      compareMode,
      focusedJobIndex,
      activeTab,

      history,
      isLoading,
      error,

      // Store values
      comparison,
      temperature,
      topP,
      maxTokens,
      disabledMetrics,

      // Setters
      setFocusedJobIndex,
      setActiveTab,

      setTemperature,
      setTopP,
      setMaxTokens,
      setDisabledMetrics,

      // Handlers
      handleDelete,

      handleSelect,
      toggleCompareMode,

      // Refs
      jobListRef,
    } = sidebarState;

    // Render collapsed sidebar if collapsed
    if (isCollapsed) {
      return (
        <CollapsedSidebar
          onOpenTab={(tab) => {
            setActiveTab(tab);
            onToggle?.(); // Expand the sidebar when a tab is clicked
          }}
          onRunEvaluation={onRunEvaluation}
          onCancelEvaluation={onCancelEvaluation}
          canRunEvaluation={canRunEvaluation}
          isRunning={isRunning}
        />
      );
    }

    // Main sidebar component with tabs
    return (
      <aside
        className="bg-card border-border flex h-full w-80 touch-pan-y flex-col overflow-hidden"
        aria-label="Sidebar with history, configuration, and custom prompt tabs"
        id="sidebar"
      >
        {/* Header with tab navigation */}
        <SidebarHeader activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content Container */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Scrollable Tab Content Area */}
          <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            {activeTab === 'history' && (
              <HistoryTab
                history={history}
                isLoading={isLoading}
                error={error}
                compareMode={compareMode}
                comparison={comparison}
                focusedJobIndex={focusedJobIndex}
                jobListRef={jobListRef}
                onToggleCompareMode={toggleCompareMode}
                onSelectJob={handleSelect}
                onDeleteJob={handleDelete}
                setFocusedJobIndex={setFocusedJobIndex}
              />
            )}

            {activeTab === 'configuration' && (
              <ConfigurationTab
                provider={provider || ''}
                model={model || ''}
                temperature={temperature}
                topP={topP}
                maxTokens={maxTokens}
                onProviderChange={onProviderChange || (() => {})}
                onModelChange={onModelChange || (() => {})}
                setTemperature={setTemperature}
                setTopP={setTopP}
                setMaxTokens={setMaxTokens}
              />
            )}

            {activeTab === 'custom' && (
              <div className="h-full overflow-y-auto">
                <CustomPrompt onLoadTemplate={onLoadTemplate || (() => {})} />
              </div>
            )}
          </div>

          {/* Footer with evaluation controls */}
          <RunEvaluationFooter
            onRunEvaluation={onRunEvaluation}
            onCancelEvaluation={onCancelEvaluation}
            canRunEvaluation={canRunEvaluation}
            isRunning={isRunning}
            promptTokens={promptTokens}
            estimatedCompletionTokens={estimatedCompletionTokens}
            totalTokens={totalTokens}
            estimatedCost={estimatedCost}
            template={template}
            inputData={inputData}
          />
        </div>
      </aside>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for React.memo optimization
    return (
      prevProps.isCollapsed === nextProps.isCollapsed &&
      prevProps.provider === nextProps.provider &&
      prevProps.model === nextProps.model &&
      prevProps.canRunEvaluation === nextProps.canRunEvaluation &&
      prevProps.isRunning === nextProps.isRunning &&
      prevProps.promptTokens === nextProps.promptTokens &&
      prevProps.estimatedCompletionTokens ===
        nextProps.estimatedCompletionTokens &&
      prevProps.totalTokens === nextProps.totalTokens &&
      prevProps.estimatedCost === nextProps.estimatedCost &&
      prevProps.template === nextProps.template &&
      prevProps.inputData === nextProps.inputData
    );
  },
);

export default AppSidebar;
