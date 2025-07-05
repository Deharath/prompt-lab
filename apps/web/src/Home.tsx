import { useState, useCallback } from 'react';
import { useJobStore } from './store/jobStore.js';
import { useDarkModeStore } from './store/darkModeStore.js';
import { useToggle } from './hooks/useToggle.js';
import AppSidebar from './components/AppSidebar.js';
import DiffView from './components/DiffView.js';
import HeaderWithTokenSummary from './components/layout/HeaderWithTokenSummary.js';
import PromptWorkspace from './components/PromptWorkspace.js';

const Home = () => {
  // Layout-only state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, toggleMobileMenu] = useToggle(false);
  
  // State received from PromptWorkspace
  const [workspaceState, setWorkspaceState] = useState<{
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
  } | null>(null);

  const { comparison } = useJobStore();

  // Get dark mode state (HTML class sync is handled by the store)
  useDarkModeStore();

  const handleStateChange = useCallback((state: typeof workspaceState) => {
    setWorkspaceState(state);
  }, []);

  const isEmptyState = !workspaceState || (!workspaceState.template && !workspaceState.inputData);
  const showComparison = comparison.baseJobId && comparison.compareJobId;

  const handleCompareJobs = (_baseId: string, _compareId: string) => {
    // Comparison state is managed by the store, we just need to react to it
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sticky Sidebar - Always visible on desktop, overlay on mobile */}
      <div
        className={`
          sticky top-0 h-screen z-30 flex-shrink-0
          lg:static lg:z-auto
          transform transition-transform duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-80 lg:w-80'} 
          ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          bg-background border-r border-border
          lg:translate-x-0
        `}
      >
        <AppSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectJob={workspaceState?.handleJobSelect || (() => {})}
          onCompareJobs={handleCompareJobs}
          provider={workspaceState?.provider || 'openai'}
          model={workspaceState?.model || 'gpt-4o-mini'}
          onProviderChange={workspaceState?.setProvider || (() => {})}
          onModelChange={workspaceState?.setModel || (() => {})}
          onLoadTemplate={workspaceState?.setTemplate || (() => {})}
          onRunEvaluation={workspaceState?.handleRun || (() => {})}
          canRunEvaluation={workspaceState?.canRunEvaluation || false}
          // Token summary data
          promptTokens={workspaceState?.promptTokens || 0}
          estimatedCompletionTokens={workspaceState?.estimatedCompletionTokens || 0}
          totalTokens={workspaceState?.totalTokens || 0}
          estimatedCost={workspaceState?.estimatedCost || 0}
          template={workspaceState?.template || ''}
          inputData={workspaceState?.inputData || ''}
        />
      </div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header with Token Summary */}
        <HeaderWithTokenSummary
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          promptTokens={workspaceState?.promptTokens || 0}
          estimatedCompletionTokens={workspaceState?.estimatedCompletionTokens || 0}
          totalTokens={workspaceState?.totalTokens || 0}
          estimatedCost={workspaceState?.estimatedCost || 0}
        />

        {/* Single Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
              onStateChange={handleStateChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
