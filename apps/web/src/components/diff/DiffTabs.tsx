import React from 'react';

export const DiffTabs = ({ activeTab, setActiveTab }) => (
  <div
    className="bg-muted flex space-x-1 rounded-lg p-1"
    role="tablist"
    aria-label="Comparison view options"
  >
    <button
      role="tab"
      aria-selected={activeTab === 'output'}
      aria-controls="output-panel"
      id="output-tab"
      onClick={() => setActiveTab('output')}
      className={`focus-visible:ring-primary flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 ${
        activeTab === 'output'
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      Output Diff
    </button>
    <button
      role="tab"
      aria-selected={activeTab === 'metrics'}
      aria-controls="metrics-panel"
      id="metrics-tab"
      onClick={() => setActiveTab('metrics')}
      className={`focus-visible:ring-primary flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 ${
        activeTab === 'metrics'
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      Metrics Comparison
    </button>
  </div>
);
