import { useState, useRef } from 'react';
import { useJobStore } from './store/jobStore.js';
import { useWorkspaceStore } from './store/workspaceStore.js';
import { useToggle } from './hooks/useToggle.js';
import AppSidebar from './components/features/sidebar/AppSidebar/index.js';
import DiffView from './components/features/diff/DiffView.js';
import Header from './components/layout/Header.js';
import PromptWorkspace, {
  type PromptWorkspaceRef,
} from './components/features/prompt/PromptWorkspace.js';

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
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      {/* Full-width Header at top */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleMobileSidebar={toggleMobileMenu}
        promptTokens={promptTokens}
        estimatedCompletionTokens={estimatedCompletionTokens}
        totalTokens={totalTokens}
        estimatedCost={estimatedCost}
      />

      {/* Main Content Area with Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Below header, left side */}
        <div
          className={`flex-shrink-0 transform transition-transform duration-300 ease-in-out ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-80 lg:w-80'} ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'} bg-background border-border border-r lg:translate-x-0`}
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

        {/* Main Content - Right side of sidebar */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
    </div>
  );
};

export default Home;
