import React from 'react';
import JobListItem from './JobListItem.js';
import type { JobSummary, ComparisonState } from './types.js';

interface HistoryTabProps {
  history: JobSummary[];
  isLoading: boolean;
  error?: Error | null;
  compareMode: boolean;
  comparison: ComparisonState;
  focusedJobIndex: number;
  jobListRef: React.RefObject<HTMLDivElement | null>;
  onToggleCompareMode: () => void;
  onSelectJob: (id: string) => void;
  onDeleteJob: (id: string, event: React.MouseEvent) => void;
  setFocusedJobIndex: (index: number) => void;
}

/**
 * HistoryTab - Tab component for displaying evaluation history
 *
 * This component handles the history tab of the unified AppSidebar, providing:
 * - List of previous evaluation jobs
 * - Comparison mode for comparing two jobs
 * - Job selection and deletion functionality
 * - Keyboard navigation support
 */
const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  isLoading,
  error,
  compareMode,
  comparison,
  focusedJobIndex,
  jobListRef,
  onToggleCompareMode,
  onSelectJob,
  onDeleteJob,
  setFocusedJobIndex,
}) => {
  return (
    <div
      className="h-full flex flex-col"
      role="tabpanel"
      id="history-panel"
      aria-labelledby="history-tab"
    >
      {/* History Header Controls */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Evaluation History
          </h3>
          <button
            onClick={onToggleCompareMode}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              compareMode
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            aria-pressed={compareMode}
            aria-label={
              compareMode
                ? 'Exit comparison mode'
                : 'Enter comparison mode to compare two jobs'
            }
          >
            {compareMode ? 'Cancel' : 'Compare'}
          </button>
        </div>

        {/* Compare Mode Instructions */}
        {compareMode && (
          <div
            className="mt-3 p-3 bg-primary/5 rounded-lg text-sm border border-primary/20"
            role="status"
            aria-live="polite"
          >
            {!comparison.baseJobId ? (
              <p>
                <strong>Step 1:</strong> Select the first job to compare
              </p>
            ) : !comparison.compareJobId ? (
              <p>
                <strong>Step 2:</strong> Select the second job to compare
              </p>
            ) : (
              <p>
                <strong>Comparing:</strong> Select a new job to change
                comparison
              </p>
            )}
          </div>
        )}
      </div>

      {/* History Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {error ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Failed to load history
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {error.message || 'Unable to fetch evaluation history'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Reload page
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              No history yet
            </h3>
            <p className="text-xs text-muted-foreground">
              Run your first evaluation to see results here
            </p>
          </div>
        ) : (
          <div
            ref={jobListRef}
            className="p-3 space-y-2"
            tabIndex={0}
            role="listbox"
            aria-label="Job history list. Use arrow keys to navigate, Enter to select, Delete to remove"
          >
            {(history || []).map((job, index) => {
              const isSelected =
                job.id === comparison.baseJobId ||
                job.id === comparison.compareJobId;
              const isFocused = index === focusedJobIndex;
              const selectionType =
                job.id === comparison.baseJobId
                  ? 'Base'
                  : job.id === comparison.compareJobId
                    ? 'Compare'
                    : null;

              return (
                <JobListItem
                  key={job.id}
                  job={job}
                  index={index}
                  isSelected={isSelected}
                  isFocused={isFocused}
                  selectionType={selectionType}
                  onSelect={onSelectJob}
                  onDelete={onDeleteJob}
                  setFocusedJobIndex={setFocusedJobIndex}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* History Footer */}
      {compareMode && comparison.baseJobId && (
        <div className="p-3 bg-muted/30 border-t border-border flex-shrink-0">
          <div className="text-xs text-muted-foreground text-center">
            {comparison.compareJobId
              ? 'Both jobs selected. Compare view will appear in main area.'
              : 'Select a second job to compare.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
