import React from 'react';

interface RunEvaluationFooterProps {
  onRunEvaluation?: () => void;
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
  canRunEvaluation = false,
  isRunning = false,
}) => {
  if (!onRunEvaluation) return null;

  return (
    <div className="border-border bg-card flex-shrink-0 border-t">
      <div className="p-4">
        <button
          onClick={onRunEvaluation}
          disabled={!canRunEvaluation || isRunning}
          className={`focus-visible:ring-primary w-full rounded-lg px-4 py-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed ${
            canRunEvaluation && !isRunning
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label={
            isRunning
              ? 'Evaluation running...'
              : canRunEvaluation
                ? 'Start evaluation'
                : 'Complete prompt and input to run evaluation'
          }
        >
          {isRunning ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="border-primary-foreground/30 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
              <span>Running...</span>
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
