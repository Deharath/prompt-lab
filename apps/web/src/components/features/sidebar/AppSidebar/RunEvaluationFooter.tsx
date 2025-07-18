import React from 'react';

interface RunEvaluationFooterProps {
  onRunEvaluation?: () => void;
  onCancelEvaluation?: () => void;
  canRunEvaluation?: boolean;
  isRunning?: boolean;
  promptTokens?: number;
  estimatedCompletionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  template?: string;
  inputData?: string;
}

const RunEvaluationFooter: React.FC<RunEvaluationFooterProps> = ({
  onRunEvaluation,
  onCancelEvaluation,
  canRunEvaluation = false,
  isRunning = false,
}) => {
  const [isCancelling, setIsCancelling] = React.useState(false);

  if (!onRunEvaluation) return null;

  const handleClick = async () => {
    if (isRunning && onCancelEvaluation) {
      setIsCancelling(true);
      try {
        await onCancelEvaluation();
      } finally {
        setIsCancelling(false);
      }
    } else if (!isRunning && onRunEvaluation) {
      onRunEvaluation();
    }
  };

  return (
    <div className="border-border bg-card flex-shrink-0 border-t">
      <div className="p-3 sm:p-4">
        <button
          onClick={handleClick}
          disabled={
            (!canRunEvaluation && !isRunning) ||
            (isRunning && !onCancelEvaluation) ||
            isCancelling
          }
          className={`focus-visible:ring-primary button-press min-h-[44px] w-full touch-manipulation rounded-lg px-4 py-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed ${
            isRunning
              ? 'border border-red-500 bg-red-600 text-white shadow-sm hover:bg-red-700'
              : canRunEvaluation
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label={
            isRunning
              ? isCancelling
                ? 'Cancelling evaluation...'
                : 'Cancel running evaluation'
              : canRunEvaluation
                ? 'Start evaluation'
                : 'Complete prompt and input to run evaluation'
          }
        >
          {isRunning ? (
            <div className="flex items-center justify-center space-x-2">
              {isCancelling ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span>{isCancelling ? 'Cancelling...' : 'Cancel'}</span>
            </div>
          ) : (
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
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m2-6v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012 2z"
                />
              </svg>
              <span>Run Evaluation</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default RunEvaluationFooter;
