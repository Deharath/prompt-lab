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
      <div className="flex items-center space-x-1 p-1 bg-muted/20 rounded-lg border border-border/50">
        <button
          onClick={() => onViewChange('input')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
            activeView === 'input'
              ? 'bg-background text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          Input & Prompt
        </button>
        <button
          onClick={() => onViewChange('results')}
          disabled={!hasResults}
          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
            activeView === 'results' && hasResults
              ? 'bg-background text-foreground shadow-sm border border-border/50'
              : hasResults
                ? 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                : 'text-muted-foreground/50 cursor-not-allowed'
          }`}
        >
          Evaluation Results
          {hasResults && (
            <span className="ml-2 inline-flex items-center justify-center w-2 h-2 bg-green-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default ViewToggle;
