import React from 'react';
import { useAppSidebar } from './useAppSidebar.js';
import SidebarHeader from './SidebarHeader.js';
import HistoryTab from './HistoryTab.js';
import ConfigurationTab from './ConfigurationTab.js';
import CustomPrompt from '../CustomPrompt.js';
import CollapsedSidebar from './CollapsedSidebar.js';
import DeleteConfirmationModal from './DeleteConfirmationModal.js';
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
const AppSidebar: React.FC<AppSidebarProps> = ({
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
  canRunEvaluation = false,
  isRunning = false,
  promptTokens = 0,
  estimatedCompletionTokens = 0,
  totalTokens = 0,
  estimatedCost = 0,
  template = '',
  inputData = '',
}) => {
  const sidebarState = useAppSidebar(isCollapsed, onSelectJob, onCompareJobs);

  // Destructure state for cleaner JSX
  const {
    // State
    compareMode,
    focusedJobIndex,
    activeTab,
    deleteConfirmation,
    history,
    isLoading,

    // Store values
    comparison,
    temperature,
    topP,
    maxTokens,
    selectedMetrics,

    // Setters
    setFocusedJobIndex,
    setActiveTab,
    setDeleteConfirmation,
    setTemperature,
    setTopP,
    setMaxTokens,
    setSelectedMetrics,

    // Handlers
    handleDelete,
    confirmDelete,
    handleSelect,
    toggleCompareMode,

    // Refs
    jobListRef,
  } = sidebarState;

  // Render collapsed sidebar if collapsed
  if (isCollapsed) {
    return (
      <CollapsedSidebar
        onToggle={onToggle}
        onOpenTab={(tab) => {
          setActiveTab(tab);
          onToggle(); // Expand the sidebar when a tab is clicked
        }}
        onRunEvaluation={onRunEvaluation}
        canRunEvaluation={canRunEvaluation}
        isRunning={isRunning}
      />
    );
  }

  // Main sidebar component with tabs
  return (
    <aside
      className="w-80 bg-card border-r border-border flex flex-col h-screen sticky top-0 overflow-hidden"
      aria-label="Sidebar with history, configuration, and custom prompt tabs"
      id="sidebar"
    >
      {/* Header with tab navigation */}
      <SidebarHeader
        onToggle={onToggle}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Tab Content Container */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {/* Scrollable Tab Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">
          {activeTab === 'history' && (
            <HistoryTab
              history={history}
              isLoading={isLoading}
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
              provider={provider}
              model={model}
              temperature={temperature}
              topP={topP}
              maxTokens={maxTokens}
              selectedMetrics={selectedMetrics}
              onProviderChange={onProviderChange}
              onModelChange={onModelChange}
              setTemperature={setTemperature}
              setTopP={setTopP}
              setMaxTokens={setMaxTokens}
              setSelectedMetrics={setSelectedMetrics}
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

      {/* Modal for delete confirmation */}
      <DeleteConfirmationModal
        deleteConfirmation={deleteConfirmation}
        onCancel={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
      />
    </aside>
  );
};

export default AppSidebar;
