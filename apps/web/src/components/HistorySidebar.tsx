import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJob, listJobs } from '../api.js';
import { useJobStore } from '../store/jobStore.js';
import ShareRunButton from './ShareRunButton.js';

interface HistorySidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onSelectJob: (jobId: string) => void;
  onCompareJobs: (baseId: string, compareId: string) => void;
}

const HistorySidebar = ({
  isCollapsed,
  onToggle,
  onSelectJob,
  onCompareJobs,
}: HistorySidebarProps) => {
  const {
    start,
    append,
    finish,
    reset,
    comparison,
    setBaseJob,
    setCompareJob,
    clearComparison,
  } = useJobStore();

  const [compareMode, setCompareMode] = useState(false);

  // Use TanStack Query for history data
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: listJobs,
    staleTime: 1000 * 60, // 1 minute
  });

  const handleSelect = async (id: string) => {
    if (compareMode) {
      if (!comparison.baseJobId) {
        clearComparison();
        setBaseJob(id);
      } else if (!comparison.compareJobId) {
        setCompareJob(id);
        onCompareJobs(comparison.baseJobId, id);
      } else {
        clearComparison();
        setBaseJob(id);
      }
      return;
    }

    try {
      reset();
      const job = await fetchJob(id);
      start({ id: job.id, status: job.status });
      if (job.result) {
        append(job.result);
      }
      finish((job.metrics as Record<string, number>) || {});
      onSelectJob(id);
    } catch (err) {
      console.error('Failed to load job', err);
    }
  };

  const toggleCompareMode = () => {
    if (compareMode) {
      setCompareMode(false);
      clearComparison();
    } else {
      setCompareMode(true);
    }
  };

  if (isCollapsed) {
    return (
      <aside
        className="w-12 bg-card border-r border-border flex flex-col h-full"
        aria-label="Collapsed job history"
        aria-hidden="true"
      >
        {/* Collapsed header */}
        <div className="p-3 border-b border-border">
          <button
            onClick={onToggle}
            className="w-6 h-6 flex items-center justify-center text-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Expand job history sidebar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {/* Collapsed indicators */}
        <div
          className="flex-1 p-2 space-y-2"
          role="list"
          aria-label="Recent jobs"
        >
          {history.slice(0, 5).map((job, _index) => (
            <button
              key={job.id}
              className={`w-full h-8 rounded border cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                job.id === comparison.baseJobId ||
                job.id === comparison.compareJobId
                  ? 'bg-primary/20 border-primary/30'
                  : 'bg-muted border-border hover:bg-muted/80'
              }`}
              onClick={() => handleSelect(job.id)}
              aria-label={`Job ${job.id.substring(0, 8)}, ${job.status}, click to load`}
              role="listitem"
            >
              <div
                className={`w-2 h-2 rounded-full mt-3 ml-3 ${
                  job.status === 'completed'
                    ? 'bg-success'
                    : job.status === 'running'
                      ? 'bg-primary animate-pulse'
                      : job.status === 'failed'
                        ? 'bg-error'
                        : 'bg-muted'
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-80 bg-card border-r border-border flex flex-col h-full"
      aria-label="Job history sidebar"
      id="history-sidebar"
    >
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                className="w-4 h-4 text-primary"
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
            <h2 className="text-lg font-semibold">History</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleCompareMode}
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

            <button
              onClick={onToggle}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Collapse job history sidebar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
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
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
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
          <div className="p-3 space-y-2 h-full overflow-y-auto">
            {(history || []).map((job) => {
              const isSelected =
                job.id === comparison.baseJobId ||
                job.id === comparison.compareJobId;
              const selectionType =
                job.id === comparison.baseJobId
                  ? 'Base'
                  : job.id === comparison.compareJobId
                    ? 'Compare'
                    : null;

              const jobTime = new Date(
                parseInt(job.id.substring(0, 8), 16) * 1000,
              ).toLocaleString();
              const shortId = job.id.substring(0, 8);

              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => handleSelect(job.id)}
                  className={`group w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary/30 shadow-sm'
                      : 'bg-background border-border hover:bg-muted/50 hover:border-border/80'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        job.status === 'completed'
                          ? 'bg-success'
                          : job.status === 'running'
                            ? 'bg-primary animate-pulse'
                            : job.status === 'failed'
                              ? 'bg-error'
                              : 'bg-muted'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          #{shortId}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            job.status === 'completed'
                              ? 'bg-success/10 text-success'
                              : job.status === 'running'
                                ? 'bg-primary/10 text-primary'
                                : job.status === 'failed'
                                  ? 'bg-error/10 text-error'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground mb-2">
                        {jobTime}
                      </div>

                      {selectionType && (
                        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/20 text-primary">
                          {selectionType}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <div onClick={(e) => e.stopPropagation()}>
                        <ShareRunButton jobId={job.id} as="span" />
                      </div>
                      <svg
                        className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {compareMode && comparison.baseJobId && (
        <footer className="p-3 bg-muted/30 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {comparison.compareJobId
              ? 'Both jobs selected. Compare view will appear in main area.'
              : 'Select a second job to compare.'}
          </div>
        </footer>
      )}
    </aside>
  );
};

export default HistorySidebar;
