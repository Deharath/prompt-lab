import React from 'react';
import JobListItem from './JobListItem.js';
import { JobListSkeleton } from '../../../ui/Skeleton.js';
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
      className="flex h-full flex-col"
      role="tabpanel"
      id="history-panel"
      aria-labelledby="history-tab"
    >
      {/* History Header Controls */}
      <div className="border-border flex-shrink-0 border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-sm font-semibold">
            Evaluation History
          </h3>
          <button
            onClick={onToggleCompareMode}
            className={`focus-visible:ring-primary rounded-md px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 ${
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
            className="bg-primary/5 border-primary/20 mt-3 rounded-lg border p-3 text-sm"
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
      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
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
            <h4 className="text-foreground mb-2 text-sm font-semibold">
              Failed to load history
            </h4>
            <p className="text-muted-foreground mb-3 text-xs">
              {error.message || 'Unable to fetch evaluation history'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-600 underline hover:text-blue-700"
            >
              Reload page
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2 p-3">
            <JobListSkeleton itemCount={5} />
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center">
            <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <svg
                className="text-muted-foreground h-6 w-6"
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
            <h3 className="text-foreground mb-1 text-sm font-medium">
              No history yet
            </h3>
            <p className="text-muted-foreground text-xs">
              Run your first evaluation to see results here
            </p>
          </div>
        ) : (
          <div
            ref={jobListRef}
            className="space-y-2 p-3"
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
        <div className="bg-muted/30 border-border flex-shrink-0 border-t p-3">
          <div className="text-muted-foreground text-center text-xs">
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
