import { useState, useEffect } from 'react';
import { UnifiedPanelTabs } from './unified-panel/UnifiedPanelTabs.js';
import { UnifiedPanelInput } from './unified-panel/UnifiedPanelInput.js';
import UnifiedPanelResults from './unified-panel/UnifiedPanelResults.js';

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

import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../../../api.js';
import type { JobSummary } from '../sidebar/AppSidebar/types.js';

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

  // Check if any jobs are currently evaluating
  const { data: history = [] } = useQuery<JobSummary[]>({
    queryKey: ['jobs'],
    queryFn: () => {
      if (!ApiClient) {
        throw new Error('ApiClient is not available');
      }
      return ApiClient.listJobs();
    },
    staleTime: 1000 * 10,
  });

  const isEvaluating = history.some((job) => job.status === 'evaluating');

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
        isEvaluating={isEvaluating}
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
          <UnifiedPanelResults metrics={metrics} />
        )}
      </div>
    </div>
  );
};

export default UnifiedPanel;
