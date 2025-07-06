import { useState, useEffect } from 'react';
import { UnifiedPanelTabs } from './unified-panel/UnifiedPanelTabs.js';
import { UnifiedPanelInput } from './unified-panel/UnifiedPanelInput.js';
import { UnifiedPanelResults } from './unified-panel/UnifiedPanelResults.js';

interface UnifiedPanelProps {
  template: string;
  inputData: string;
  onTemplateChange: (value: string) => void;
  onInputDataChange: (value: string) => void;
  model: string;
  onStartWithExample: () => void;
  isEmptyState: boolean;
  metrics: Record<string, unknown> | undefined;
  hasResults: boolean;
}

const UnifiedPanel = ({
  template,
  inputData,
  onTemplateChange,
  onInputDataChange,
  model,
  onStartWithExample,
  isEmptyState,
  metrics,
  hasResults,
}: UnifiedPanelProps) => {
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');

  useEffect(() => {
    if (hasResults && activeTab === 'input') {
      const hasManuallySelectedTab = sessionStorage.getItem(
        'unifiedPanel-manualTab',
      );
      if (!hasManuallySelectedTab) {
        setActiveTab('results');
      }
    }
  }, [hasResults, activeTab]);

  const handleTabChange = (tab: 'input' | 'results') => {
    setActiveTab(tab);
    sessionStorage.setItem('unifiedPanel-manualTab', 'true');
  };

  return (
    <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
      <UnifiedPanelTabs
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        hasResults={hasResults}
      />
      <div className="p-6">
        {activeTab === 'input' ? (
          <UnifiedPanelInput
            template={template}
            inputData={inputData}
            onTemplateChange={onTemplateChange}
            onInputDataChange={onInputDataChange}
            model={model}
            onStartWithExample={onStartWithExample}
            isEmptyState={isEmptyState}
          />
        ) : (
          <UnifiedPanelResults metrics={metrics} hasResults={hasResults} />
        )}
      </div>
    </div>
  );
};

export default UnifiedPanel;
