import React from 'react';

interface UnifiedPanelTabsProps {
  activeTab: 'input' | 'results';
  handleTabChange: (tab: 'input' | 'results') => void;
  hasResults: boolean;
  isEvaluating?: boolean;
}

export const UnifiedPanelTabs = ({
  activeTab,
  handleTabChange,
  hasResults,
  isEvaluating = false,
}: UnifiedPanelTabsProps) => (
  <div className="border-border bg-muted/20 relative border-b">
    <div className="relative flex items-center">
      {/* Background highlight that fills the entire button */}
      <div className="absolute inset-0 bg-transparent">
        <div
          className={`bg-background h-full transition-all duration-300 ${
            activeTab === 'input'
              ? 'w-1/2 translate-x-0'
              : 'w-1/2 translate-x-full'
          }`}
        />
      </div>

      <button
        onClick={() => handleTabChange('input')}
        className={`relative z-10 min-h-[48px] flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
          activeTab === 'input'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
        }`}
      >
        <div className="flex items-center justify-center space-x-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Input & Prompt</span>
        </div>
      </button>
      <button
        onClick={() => handleTabChange('results')}
        className={`relative z-10 min-h-[48px] flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
          activeTab === 'results'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
        }`}
      >
        <div className="flex items-center justify-center space-x-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <div className="flex items-center space-x-1">
            <span>Evaluation Results</span>
            {isEvaluating && (
              <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
            )}
          </div>
          {hasResults && !isEvaluating && (
            <span className="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-green-500" />
          )}
        </div>
      </button>
    </div>

    {/* Bottom border indicator */}
    <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-transparent">
      <div
        className={`bg-primary h-full transition-all duration-300 ${
          activeTab === 'input'
            ? 'w-1/2 translate-x-0'
            : 'w-1/2 translate-x-full'
        }`}
      />
    </div>
  </div>
);
