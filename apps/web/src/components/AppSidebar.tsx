import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchJob, listJobs, deleteJob } from '../api.js';
import { useJobStore } from '../store/jobStore.js';
import ShareRunButton from './ShareRunButton.js';
import ModelSelector from './ModelSelector.js';
import RunConfiguration from './RunConfiguration.js';
import MetricSelector from './MetricSelector.js';
import { AVAILABLE_METRICS } from '../constants/metrics.js';

// Type definition for JobSummary (from API)
interface JobSummary {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  provider: string;
  model: string;
  costUsd?: number | null;
  avgScore?: number | null;
  resultSnippet?: string | null;
}

interface HistorySidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onSelectJob: (jobId: string) => void;
  onCompareJobs: (baseId: string, compareId: string) => void;
  // Configuration props
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}

const AppSidebar = ({
  isCollapsed,
  onToggle,
  onSelectJob,
  onCompareJobs,
  provider,
  model,
  onProviderChange,
  onModelChange,
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
    running,
    // Configuration values from store
    temperature,
    topP,
    maxTokens,
    selectedMetrics,
    setTemperature,
    setTopP,
    setMaxTokens,
    setSelectedMetrics,
  } = useJobStore();

  const [compareMode, setCompareMode] = useState(false);
  const [focusedJobIndex, setFocusedJobIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<
    'history' | 'configuration' | 'custom'
  >('history');
  const queryClient = useQueryClient();
  const jobListRef = useRef<HTMLDivElement>(null);

  // Use TanStack Query for history data with auto-refresh
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: listJobs,
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: 1000 * 15, // Refetch every 15 seconds for live updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  // Issue #1 fix: Immediately refresh history when job finishes
  const prevRunning = useRef(running);
  useEffect(() => {
    if (prevRunning.current && !running) {
      // Job just finished, immediately refresh history
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
    prevRunning.current = running;
  }, [running, queryClient]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCollapsed || history.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedJobIndex((prev) =>
            prev < history.length - 1 ? prev + 1 : prev,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedJobIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedJobIndex >= 0 && focusedJobIndex < history.length) {
            handleSelect(history[focusedJobIndex].id);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (focusedJobIndex >= 0 && focusedJobIndex < history.length) {
            const mockEvent = { stopPropagation: () => {} } as React.MouseEvent;
            handleDelete(history[focusedJobIndex].id, mockEvent);
          }
          break;
        case 'Escape':
          setFocusedJobIndex(-1);
          break;
      }
    };

    if (jobListRef.current) {
      jobListRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        jobListRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [focusedJobIndex, history, isCollapsed]);

  // Helper function to generate readable labels - Bug #1 fix
  const getReadableLabel = (job: JobSummary) => {
    // Enhanced readability with clear prompt preview
    const identifier = `#${job.id.substring(0, 8)}`;
    const modelInfo = `${job.provider}/${job.model}`;

    // Add status context for better identification
    const statusInfo =
      job.status === 'completed'
        ? '✓'
        : job.status === 'failed'
          ? '✗'
          : job.status === 'running'
            ? '⏳'
            : '⏸';

    return `${statusInfo} ${identifier} • ${modelInfo}`;
  };

  // Helper function to format timestamp separately for better visibility - Bug #2 fix
  const getFormattedTimestamp = (job: JobSummary) => {
    return format(job.createdAt, 'MMM d · HH:mm');
  };

  // Delete handler with custom confirmation modal - Issue #2 fix
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    jobId: string;
    shortId: string;
  } | null>(null);

  const handleDelete = async (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const shortId = jobId.substring(0, 8);
    setDeleteConfirmation({ jobId, shortId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const { jobId } = deleteConfirmation;
    setDeleteConfirmation(null);

    try {
      // Optimistic update - remove from cache immediately
      queryClient.setQueryData(['jobs'], (oldJobs: JobSummary[] | undefined) =>
        oldJobs ? oldJobs.filter((job) => job.id !== jobId) : [],
      );

      // Clear comparison if the deleted job was selected
      if (comparison.baseJobId === jobId || comparison.compareJobId === jobId) {
        clearComparison();
      }

      // Make API call
      await deleteJob(jobId);

      // Invalidate query to refresh from server
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (error) {
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      console.error('Failed to delete job:', error);
      // You could add a toast notification here instead of alert
    }
  };

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
      start({
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
        provider: job.provider,
        model: job.model,
        costUsd: job.costUsd || null,
        avgScore: null, // Will be calculated from metrics if needed
      });
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
        {/* Collapsed header - Bug #3 fix */}
        <div className="p-3 border-b border-border">
          <button
            onClick={onToggle}
            className="w-6 h-6 flex items-center justify-center text-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label="Expand job history sidebar"
            title="Expand History"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Collapsed indicators - Bug #4 fix */}
        <div
          className="flex-1 p-2 space-y-2"
          role="list"
          aria-label="Recent jobs"
        >
          {history.slice(0, 8).map((job, _index) => (
            <button
              key={job.id}
              className={`w-full h-8 rounded-lg border cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center relative group ${
                job.id === comparison.baseJobId ||
                job.id === comparison.compareJobId
                  ? 'bg-primary/20 border-primary/50 shadow-sm'
                  : 'bg-card border-border hover:bg-muted/60 hover:border-border/80 hover:shadow-sm'
              }`}
              onClick={() => handleSelect(job.id)}
              aria-label={`Job ${job.id.substring(0, 8)}, ${job.status}, click to load`}
              role="listitem"
              title={`Job #${job.id.substring(0, 8)} • ${job.provider}/${job.model} • ${getFormattedTimestamp(job)}`}
            >
              {/* Status indicator with icon */}
              <div className="flex items-center justify-center">
                {job.status === 'completed' ? (
                  <svg
                    className="w-4 h-4 text-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : job.status === 'running' ? (
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                ) : job.status === 'failed' ? (
                  <svg
                    className="w-4 h-4 text-error"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/60"></div>
                )}
              </div>

              {/* Position indicator for selection order */}
              {(job.id === comparison.baseJobId ||
                job.id === comparison.compareJobId) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {job.id === comparison.baseJobId ? '1' : '2'}
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-80 bg-card border-r border-border flex flex-col max-h-screen"
      aria-label="Sidebar with history, configuration, and custom prompt tabs"
      id="sidebar"
    >
      {/* Tab Header */}
      <header className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">PromptLab</h2>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Collapse sidebar"
            title="Collapse Sidebar"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-muted p-1">
          {[
            {
              id: 'history',
              label: 'History',
              icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              id: 'configuration',
              label: 'Config',
              icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4',
            },
            {
              id: 'custom',
              label: 'Custom',
              icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'history' | 'configuration' | 'custom')
              }
              className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={activeTab === tab.id}
              aria-label={`Switch to ${tab.label} tab`}
            >
              <svg
                className="w-4 h-4"
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
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'history' && (
          <div className="h-full flex flex-col">
            {/* History Header Controls */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Evaluation History
                </h3>
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

            {/* History Content */}
            <div className="flex-1 overflow-hidden min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
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
                  className="p-3 space-y-2 h-full overflow-y-auto"
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

                    const shortId = job.id.substring(0, 8);
                    const readableLabel = getReadableLabel(job);
                    const timestamp = getFormattedTimestamp(job); // Bug #2 fix

                    return (
                      <div
                        key={job.id}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'bg-primary/8 border-primary/40 shadow-lg ring-2 ring-primary/30'
                            : isFocused
                              ? 'bg-primary/4 border-primary/20 shadow-md ring-1 ring-primary/20'
                              : 'bg-card border-border/60 hover:bg-muted/30 hover:border-border hover:shadow-md'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(job.id)}
                        onFocus={() => setFocusedJobIndex(index)}
                        tabIndex={0}
                        aria-label={`Job: ${readableLabel}, Status: ${job.status}, Created: ${timestamp}`}
                      >
                        {/* Status stripe */}
                        <div
                          className={`absolute left-0 top-0 w-1 h-full ${
                            job.status === 'completed'
                              ? 'bg-success'
                              : job.status === 'running'
                                ? 'bg-primary'
                                : job.status === 'failed'
                                  ? 'bg-destructive'
                                  : 'bg-muted-foreground/40'
                          }`}
                        />

                        <div className="p-4 pl-6">
                          {/* Header row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-foreground">
                                #{shortId}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  job.status === 'completed'
                                    ? 'bg-success/15 text-success border border-success/20'
                                    : job.status === 'running'
                                      ? 'bg-primary/15 text-primary border border-primary/20'
                                      : job.status === 'failed'
                                        ? 'bg-destructive/15 text-destructive border border-destructive/20'
                                        : 'bg-muted text-muted-foreground border border-border'
                                }`}
                              >
                                {job.status}
                              </span>
                              {selectionType && (
                                <div className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                                  {selectionType}
                                </div>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div onClick={(e) => e.stopPropagation()}>
                                <ShareRunButton jobId={job.id} as="span" />
                              </div>

                              <button
                                onClick={(e) => handleDelete(job.id, e)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/20 cursor-pointer"
                                aria-label={`Delete job ${shortId}`}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Response content snippet - Issue #1 fix */}
                          {job.resultSnippet && (
                            <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-border/40">
                              <div className="text-xs text-muted-foreground/80 font-medium mb-1 uppercase tracking-wide">
                                Response
                              </div>
                              <div className="text-sm text-foreground/90 leading-relaxed font-mono">
                                "{job.resultSnippet}"
                              </div>
                            </div>
                          )}

                          {/* Technical details */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">
                                {job.provider}/{job.model}
                              </span>
                              <span className="text-muted-foreground">
                                {timestamp}
                              </span>
                            </div>

                            {(job.costUsd || job.avgScore) && (
                              <div className="flex items-center space-x-4 text-xs">
                                {job.costUsd && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-muted-foreground/70">
                                      Cost:
                                    </span>
                                    <span className="font-medium text-foreground/80">
                                      ${job.costUsd.toFixed(4)}
                                    </span>
                                  </div>
                                )}
                                {job.avgScore && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-muted-foreground/70">
                                      Score:
                                    </span>
                                    <span className="font-medium text-foreground/80">
                                      {job.avgScore.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History Footer */}
            {compareMode && comparison.baseJobId && (
              <div className="p-3 bg-muted/30 border-t border-border">
                <div className="text-xs text-muted-foreground text-center">
                  {comparison.compareJobId
                    ? 'Both jobs selected. Compare view will appear in main area.'
                    : 'Select a second job to compare.'}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'configuration' && (
          <div className="h-full overflow-y-auto p-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Model Configuration
              </h3>
              <ModelSelector
                provider={provider}
                model={model}
                onProviderChange={onProviderChange}
                onModelChange={onModelChange}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Run Parameters
              </h3>
              <RunConfiguration
                temperature={temperature}
                topP={topP}
                maxTokens={maxTokens}
                onTemperatureChange={setTemperature}
                onTopPChange={setTopP}
                onMaxTokensChange={setMaxTokens}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Evaluation Metrics
              </h3>
              <MetricSelector
                metrics={AVAILABLE_METRICS}
                selectedMetrics={selectedMetrics}
                onChange={setSelectedMetrics}
              />
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center">
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                Custom Prompts
              </h3>
              <p className="text-xs text-muted-foreground">
                Feature coming soon
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal - Fixed positioning to always be visible */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Delete Job #{deleteConfirmation.shortId}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this job? All associated data
                including results and metrics will be permanently removed.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 border border-border rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 border border-destructive rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  Delete Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
