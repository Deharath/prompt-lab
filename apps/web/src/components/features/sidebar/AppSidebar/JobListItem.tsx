import React, { memo } from 'react';
import ShareRunButton from '../../../shared/ShareRunButton.js';

import type { JobSummary } from './types.js';
import { getReadableLabel, getFormattedTimestamp } from './utils.js';

interface JobListItemProps {
  job: JobSummary;
  index: number;
  isSelected: boolean;
  isFocused: boolean;
  selectionType: 'Base' | 'Compare' | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
  setFocusedJobIndex: (index: number) => void;
}

const JobListItem = memo<JobListItemProps>(
  ({
    job,
    index,
    isSelected,
    isFocused,
    selectionType,
    onSelect,
    onDelete,
    setFocusedJobIndex,
  }) => {
    const shortId = job.id.substring(0, 8);
    const readableLabel = getReadableLabel(job);
    const timestamp = getFormattedTimestamp(job);

    return (
      <div
        key={job.id}
        className={`group relative cursor-pointer touch-manipulation overflow-hidden rounded-xl border-2 transition-all ${
          isSelected
            ? 'bg-primary/8 border-primary/40 ring-primary/30 shadow-lg ring-2'
            : isFocused
              ? 'bg-primary/4 border-primary/20 ring-primary/20 shadow-md ring-1'
              : 'bg-card border-border/60 hover:bg-muted/30 hover:border-border hover:shadow-md'
        }`}
        role="option"
        aria-selected={isSelected}
        onClick={() => onSelect(job.id)}
        onFocus={() => setFocusedJobIndex(index)}
        tabIndex={0}
        aria-label={`Job: ${readableLabel}, Status: ${job.status}, Created: ${timestamp}`}
      >
        {/* Status stripe */}
        <div
          className={`absolute top-0 left-0 h-full w-1 ${
            job.status === 'completed'
              ? 'bg-success'
              : job.status === 'running'
                ? 'bg-primary'
                : job.status === 'evaluating'
                  ? 'bg-yellow-500'
                  : job.status === 'failed'
                    ? 'bg-destructive'
                    : job.status === 'cancelled'
                      ? 'bg-orange-500'
                      : 'bg-muted-foreground/40'
          }`}
        />

        <div className="p-4 pl-6">
          {/* Header row */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-foreground text-sm font-bold">
                #{shortId}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  job.status === 'completed'
                    ? 'bg-success/15 text-success border-success/20 border'
                    : job.status === 'running'
                      ? 'bg-primary/15 text-primary border-primary/20 border'
                      : job.status === 'evaluating'
                        ? 'border border-yellow-500/20 bg-yellow-500/15 text-yellow-700'
                        : job.status === 'failed'
                          ? 'bg-destructive/15 text-destructive border-destructive/20 border'
                          : job.status === 'cancelled'
                            ? 'border border-orange-500/20 bg-orange-500/15 text-orange-700'
                            : 'bg-muted text-muted-foreground border-border border'
                }`}
              >
                {job.status}
              </span>
              {selectionType && (
                <div className="bg-primary/20 text-primary border-primary/30 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                  {selectionType}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <div onClick={(e) => e.stopPropagation()}>
                <ShareRunButton jobId={job.id} as="span" />
              </div>

              <button
                onClick={(e) => onDelete(job.id, e)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/20 flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-md p-1.5 transition-colors focus:outline-none focus-visible:ring-2"
                aria-label={`Delete job ${shortId}`}
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Response content snippet - Issue #1 fix */}
          {job.resultSnippet && (
            <div className="bg-muted/30 border-border/40 mb-3 rounded-lg border p-3">
              <div className="text-muted-foreground/80 mb-1 text-xs font-medium tracking-wide uppercase">
                Response
              </div>
              <div className="text-foreground/90 font-mono text-sm leading-relaxed">
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
              <span className="text-muted-foreground">{timestamp}</span>
            </div>

            {job.costUsd && (
              <div className="flex items-center space-x-4 text-xs">
                {job.costUsd && (
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground/70">Cost:</span>
                    <span className="text-foreground/80 font-medium">
                      ${job.costUsd.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for React.memo optimization
    return (
      prevProps.job.id === nextProps.job.id &&
      prevProps.index === nextProps.index &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isFocused === nextProps.isFocused &&
      prevProps.selectionType === nextProps.selectionType &&
      prevProps.job.status === nextProps.job.status &&
      prevProps.job.createdAt === nextProps.job.createdAt
    );
  },
);

export default JobListItem;
