import { ReactNode } from 'react';

interface ViewToggleProps {
  activeView: 'input' | 'results';
  onViewChange: (view: 'input' | 'results') => void;
  hasResults: boolean;
  children: ReactNode;
}

const ViewToggle = ({
  activeView,
  onViewChange,
  hasResults,
  children,
}: ViewToggleProps) => {
  return (
    <div className="space-y-6">
      {/* Toggle Header */}
      <div className="bg-muted/20 border-border/50 flex items-center space-x-1 rounded-lg border p-1">
        <button
          onClick={() => onViewChange('input')}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            activeView === 'input'
              ? 'bg-background text-foreground border-border/50 border shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          Input & Prompt
        </button>
        <button
          onClick={() => onViewChange('results')}
          disabled={!hasResults}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            activeView === 'results' && hasResults
              ? 'bg-background text-foreground border-border/50 border shadow-sm'
              : hasResults
                ? 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                : 'text-muted-foreground/50 cursor-not-allowed'
          }`}
        >
          Evaluation Results
          {hasResults && (
            <span className="ml-2 inline-flex h-2 w-2 items-center justify-center rounded-full bg-green-500" />
          )}
        </button>
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default ViewToggle;
