import React, { useState, useRef, useEffect } from 'react';
import { useJobStore } from './store/jobStore.js';
import { useJobStreaming } from './hooks/useJobStreaming.js';
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

  // Touch handling for swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const {
    comparison,
    temperature,
    topP,
    maxTokens,
    selectedMetrics,
    running,
    current,
  } = useJobStore();

  const { cancelStream } = useJobStreaming();

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

  const handleCancel = async () => {
    // Cancel the current running job
    if (current?.id) {
      await cancelStream(current.id);
    }
  };

  const handleCompareJobs = (_baseId: string, _compareId: string) => {
    // Comparison state is managed by the store, we just need to react to it
  };

  // Handle swipe gestures for mobile sidebar
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Only enable swipe gestures on mobile screens
    if (window.innerWidth < 1024) {
      // Right swipe from left edge opens sidebar (only when closed)
      if (isRightSwipe && touchStart < 50 && sidebarCollapsed) {
        setSidebarCollapsed(false);
      }
      // Left swipe closes sidebar (only when open)
      else if (isLeftSwipe && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    }

    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      className="bg-background flex h-screen flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-width Header at top */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleMobileSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        promptTokens={promptTokens}
        estimatedCompletionTokens={estimatedCompletionTokens}
        totalTokens={totalTokens}
        estimatedCost={estimatedCost}
      />

      {/* Main Content Area with Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Below header, left side */}
        <div
          className={`flex-shrink-0 transform transition-transform duration-300 ease-in-out ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-80 lg:w-80'} ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'} bg-background border-border mobile-full-height fixed top-16 bottom-0 left-0 z-30 border-r lg:relative lg:inset-auto lg:translate-x-0`}
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
            onCancelEvaluation={handleCancel}
            canRunEvaluation={canRunEvaluation}
            isRunning={running}
            // Token summary data
            promptTokens={promptTokens}
            estimatedCompletionTokens={estimatedCompletionTokens}
            totalTokens={totalTokens}
            estimatedCost={estimatedCost}
            template={template}
            inputData={inputData}
          />
        </div>

        {/* Mobile overlay - only show when sidebar is open on mobile */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
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
