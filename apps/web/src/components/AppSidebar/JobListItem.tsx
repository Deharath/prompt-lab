import React from 'react';
import ShareRunButton from '../ShareRunButton.js';
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

const JobListItem: React.FC<JobListItemProps> = ({
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
      className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-primary/8 border-primary/40 shadow-lg ring-2 ring-primary/30'
          : isFocused
            ? 'bg-primary/4 border-primary/20 shadow-md ring-1 ring-primary/20'
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
              onClick={(e) => onDelete(job.id, e)}
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
            <span className="text-muted-foreground">{timestamp}</span>
          </div>

          {(job.costUsd || job.avgScore) && (
            <div className="flex items-center space-x-4 text-xs">
              {job.costUsd && (
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground/70">Cost:</span>
                  <span className="font-medium text-foreground/80">
                    ${job.costUsd.toFixed(4)}
                  </span>
                </div>
              )}
              {job.avgScore && (
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground/70">Score:</span>
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
};

export default JobListItem;
