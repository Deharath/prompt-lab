import { useState, useRef } from 'react';
import { useJobStore } from './store/jobStore.js';
import { useWorkspaceStore } from './store/workspaceStore.js';
import { useDarkModeStore } from './store/darkModeStore.js';
import { useToggle } from './hooks/useToggle.js';
import AppSidebar from './components/AppSidebar.js';
import DiffView from './components/DiffView.js';
import HeaderWithTokenSummary from './components/layout/HeaderWithTokenSummary.js';
import PromptWorkspace, {
  type PromptWorkspaceRef,
} from './components/PromptWorkspace.js';

const Home = () => {
  // Layout-only state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, toggleMobileMenu] = useToggle(false);

  const { comparison, temperature, topP, maxTokens, selectedMetrics } =
    useJobStore();

  // Get workspace data from store
  const {
    template,
    inputData,
    provider,
    model,
    promptTokens,
    estimatedCompletionTokens,
    totalTokens,
    estimatedCost,
    setProvider,
    setModel,
    setTemplate,
    loadJobData,
  } = useWorkspaceStore();

  const canRunEvaluation = !!(template && inputData);

  // Reference to PromptWorkspace component
  const promptWorkspaceRef = useRef<PromptWorkspaceRef>(null);

  // Get dark mode state (HTML class sync is handled by the store)
  useDarkModeStore();

  const showComparison = comparison.baseJobId && comparison.compareJobId;

  const handleJobSelect = async (jobId: string) => {
    await loadJobData(jobId);
  };

  const handleRun = async () => {
    // Call the PromptWorkspace's handleRun method via ref
    if (promptWorkspaceRef.current) {
      await promptWorkspaceRef.current.handleRun();
    }
  };

  const handleCompareJobs = (_baseId: string, _compareId: string) => {
    // Comparison state is managed by the store, we just need to react to it
  };

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      {/* Sticky Sidebar - Always visible on desktop, overlay on mobile */}
      <div
        className={`sticky top-0 z-30 h-screen flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:static lg:z-auto ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-80 lg:w-80'} ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'} bg-background border-border border-r lg:translate-x-0`}
      >
        <AppSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectJob={handleJobSelect}
          onCompareJobs={handleCompareJobs}
          provider={provider}
          model={model}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onLoadTemplate={setTemplate}
          onRunEvaluation={handleRun}
          canRunEvaluation={canRunEvaluation}
          // Token summary data
          promptTokens={promptTokens}
          estimatedCompletionTokens={estimatedCompletionTokens}
          totalTokens={totalTokens}
          estimatedCost={estimatedCost}
          template={template}
          inputData={inputData}
        />
      </div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="bg-opacity-50 fixed inset-0 z-20 bg-black lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content Area */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header with Token Summary */}
        <HeaderWithTokenSummary
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          promptTokens={promptTokens}
          estimatedCompletionTokens={estimatedCompletionTokens}
          totalTokens={totalTokens}
          estimatedCost={estimatedCost}
        />

        {/* Single Scrollable Content Container */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {showComparison ? (
            // Show comparison view when comparing jobs
            <section className="p-4 sm:p-6" aria-label="Job comparison view">
              <DiffView
                baseJobId={comparison.baseJobId!}
                compareJobId={comparison.compareJobId!}
                onClose={() => {}}
              />
            </section>
          ) : (
            // Use the new PromptWorkspace component
            <PromptWorkspace
              ref={promptWorkspaceRef}
              onJobSelect={handleJobSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
