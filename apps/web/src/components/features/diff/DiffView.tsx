import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../../../api.js';
import { useJobStore } from '../../../store/jobStore.js';
import Card from '../../ui/Card.js';
import Button from '../../ui/Button.js';
import { DiffHeader } from './DiffHeader.js';
import { DiffTabs } from './DiffTabs.js';
import { DiffOutput } from './DiffOutput.js';
import { DiffMetrics } from './DiffMetrics.js';

interface DiffViewProps {
  baseJobId: string;
  compareJobId: string;
  onClose: () => void;
}

const DiffView = ({ baseJobId, compareJobId, onClose }: DiffViewProps) => {
  const { clearComparison } = useJobStore();
  const [activeTab, setActiveTab] = useState<'output' | 'metrics'>('output');

  const {
    data: diff,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['diff', baseJobId, compareJobId],
    queryFn: () => {
      console.log('Fetching diff for jobs:', baseJobId, compareJobId);
      return ApiClient.diffJobs(baseJobId, compareJobId);
    },
    enabled: !!(baseJobId && compareJobId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add debugging logs
  console.log('DiffView render:', {
    baseJobId,
    compareJobId,
    diff,
    isLoading,
    error,
    activeTab,
  });

  const handleClose = () => {
    clearComparison();
    onClose();
  };

  if (isLoading) {
    return (
      <Card title="Loading Comparison">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground">Loading comparison...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !diff) {
    return (
      <Card title="Comparison Error">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="bg-error/10 flex h-12 w-12 items-center justify-center rounded-full">
            <svg
              className="text-error h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-foreground mb-1 text-sm font-medium">
              Failed to load comparison
            </h3>
            <p className="text-muted-foreground text-xs">
              Please try again or select different jobs
            </p>
          </div>
          <Button onClick={handleClose} variant="secondary" size="sm">
            Close
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Job comparison view">
      <DiffHeader
        baseJobId={baseJobId}
        compareJobId={compareJobId}
        onClose={handleClose}
      />
      <DiffTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'output' && diff && (
        <DiffOutput baseJob={diff.baseJob} compareJob={diff.compareJob} />
      )}

      {activeTab === 'metrics' && diff && (
        <DiffMetrics baseJob={diff.baseJob} compareJob={diff.compareJob} />
      )}
    </div>
  );
};

export default DiffView;
