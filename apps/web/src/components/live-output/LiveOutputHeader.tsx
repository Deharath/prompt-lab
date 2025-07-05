import React from 'react';

interface LiveOutputHeaderProps {
  status: 'idle' | 'streaming' | 'complete' | 'error';
  viewMode: 'rendered' | 'raw';
  setViewMode: (mode: 'rendered' | 'raw') => void;
  copied: boolean;
  handleCopy: () => void;
}

export const LiveOutputHeader: React.FC<LiveOutputHeaderProps> = ({
  status,
  viewMode,
  setViewMode,
  copied,
  handleCopy,
}) => {
  const statusIndicator = () => {
    if (status === 'streaming') {
      return (
        <span className="flex items-center space-x-1 text-green-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-xs">Streaming...</span>
        </span>
      );
    }
    if (status === 'complete') {
      return (
        <span className="flex items-center space-x-1 text-green-500">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs">Complete</span>
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="flex items-center space-x-1 text-red-500">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-xs">Error</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div
          className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg"
          aria-hidden="true"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2
          className="text-foreground text-lg font-semibold"
          id="output-stream-heading"
        >
          Output Stream
        </h2>
        <div className="ml-4" aria-live="polite" aria-label="Output status">
          {statusIndicator()}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div
          className="bg-muted border-border flex overflow-hidden rounded-lg border"
          role="group"
          aria-label="Output view mode"
        >
          <button
            className={`focus-visible:ring-primary px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 ${
              viewMode === 'rendered'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('rendered')}
            aria-pressed={viewMode === 'rendered'}
            aria-label="View as rendered markdown"
          >
            Rendered
          </button>
          <button
            className={`focus-visible:ring-primary px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 ${
              viewMode === 'raw'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('raw')}
            aria-pressed={viewMode === 'raw'}
            aria-label="View as raw text"
          >
            Raw
          </button>
        </div>
        <button
          className="bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground focus-visible:ring-primary border-border flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2"
          onClick={handleCopy}
          aria-label={
            copied ? 'Output copied to clipboard' : 'Copy output to clipboard'
          }
        >
          {copied ? (
            <span className="flex items-center">
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </span>
          ) : (
            <span className="flex items-center">
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 17h8m-4-4v8m-4-4a4 4 0 118 0 4 4 0 01-8 0z"
                />
              </svg>
              Copy
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
