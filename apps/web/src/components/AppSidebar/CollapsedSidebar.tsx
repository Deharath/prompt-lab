import React from 'react';

interface CollapsedSidebarProps {
  onToggle: () => void;
  onOpenTab: (tab: 'history' | 'configuration' | 'custom') => void;
  onRunEvaluation?: () => void;
  canRunEvaluation?: boolean;
  isRunning?: boolean;
}

const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({
  onToggle,
  onOpenTab,
  onRunEvaluation,
  canRunEvaluation = false,
  isRunning = false,
}) => {
  const tabs = [
    {
      id: 'history' as const,
      label: 'History',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      description: 'Job History & Comparison',
    },
    {
      id: 'configuration' as const,
      label: 'Config',
      icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4',
      description: 'Model Settings & Parameters',
    },
    {
      id: 'custom' as const,
      label: 'Custom',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      description: 'Custom Templates & Tools',
    },
  ];

  return (
    <aside
      className="bg-card border-border flex h-full w-16 flex-col border-r"
      aria-label="Collapsed sidebar with tab buttons"
    >
      {/* Prominent Expand Button */}
      <div className="border-border border-b p-2">
        <button
          onClick={onToggle}
          className="text-muted hover:text-foreground focus-visible:ring-primary bg-background hover:bg-primary/10 border-muted hover:border-primary/50 flex h-12 w-full transform items-center justify-center rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus-visible:ring-2"
          aria-label="Expand sidebar"
          title="Expand Sidebar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Tab Buttons */}
      <div className="flex-1 space-y-3 p-2 pt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onOpenTab(tab.id)}
            className="border-muted hover:border-primary/50 focus-visible:ring-primary bg-background hover:bg-primary/10 group flex h-12 w-full transform cursor-pointer flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus-visible:ring-2"
            aria-label={`Open ${tab.label} tab - ${tab.description}`}
            title={`${tab.label}\n${tab.description}`}
          >
            <svg
              className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={tab.icon}
              />
            </svg>
            <span className="text-muted-foreground group-hover:text-primary mt-1 text-[10px] font-medium transition-colors duration-200">
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Run Evaluation Button */}
      {onRunEvaluation && (
        <div className="border-border border-t p-2">
          <button
            onClick={onRunEvaluation}
            disabled={!canRunEvaluation || isRunning}
            className={`focus-visible:ring-primary group flex h-12 w-full flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 ${
              canRunEvaluation && !isRunning
                ? 'border-primary bg-primary hover:bg-primary/90 text-primary-foreground transform hover:scale-105 hover:shadow-lg'
                : 'border-muted bg-muted/50 text-muted-foreground cursor-not-allowed'
            }`}
            aria-label={
              isRunning
                ? 'Evaluation is running...'
                : canRunEvaluation
                  ? 'Run evaluation with current prompt and input'
                  : 'Complete prompt and input to run evaluation'
            }
            title={
              isRunning
                ? 'Running...'
                : canRunEvaluation
                  ? 'Run Evaluation'
                  : 'Need prompt & input'
            }
          >
            {isRunning ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="mt-1 text-[10px] font-medium">Running</span>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 transition-colors duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="mt-1 text-[10px] font-medium">Run</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};

export default CollapsedSidebar;
