import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DiffViewer from 'react-diff-viewer-continued';
import { ApiClient, type JobDetails } from '../api.js';
import { useJobStore } from '../store/jobStore.js';
import Card from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';

interface DiffResponse {
  baseJob: JobDetails;
  compareJob: JobDetails;
}

const isImprovement = (key: string, delta: number) => {
  const lower = key.toLowerCase();
  if (
    lower.includes('cost') ||
    lower.includes('token') ||
    lower.includes('latency')
  ) {
    return delta <= 0; // lower is better
  }
  return delta >= 0; // higher is better
};

const format = (val: number | undefined) =>
  val === undefined || val === null ? 'N/A' : val.toFixed(3);

const DiffPage = () => {
  const { comparison, clearComparison } = useJobStore();
  const navigate = useNavigate();
  const [diff, setDiff] = useState<DiffResponse | null>(null);

  useEffect(() => {
    const { baseJobId, compareJobId } = comparison;
    if (!baseJobId || !compareJobId) {
      navigate('/');
      return;
    }
    ApiClient.diffJobs(baseJobId, compareJobId)
      .then(setDiff)
      .catch((err) => {
        console.error('Failed to load diff', err);
      });
  }, [comparison, navigate]);

  if (!diff) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2" />
          <span className="text-muted-foreground">Loading diff...</span>
        </div>
      </div>
    );
  }

  const { baseJob, compareJob } = diff;
  const baseMetrics = (baseJob.metrics as Record<string, number>) || {};
  const compareMetrics = (compareJob.metrics as Record<string, number>) || {};
  const metricKeys = Array.from(
    new Set([...Object.keys(baseMetrics), ...Object.keys(compareMetrics)]),
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => {
                  clearComparison();
                  navigate('/');
                }}
                variant="secondary"
                size="sm"
                icon={
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                }
              >
                Back to Lab
              </Button>
              <h1 className="text-foreground text-2xl font-bold">
                Job Comparison
              </h1>
            </div>
          </div>
        </div>

        {/* Comparison Details */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card title={`Base Job (${baseJob.id})`}>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Model:</strong> {baseJob.model}
              </div>
              <div>
                <strong>Created:</strong>{' '}
                {new Date(baseJob.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Status:</strong> {baseJob.status}
              </div>
              {baseJob.tokensUsed && (
                <div>
                  <strong>Tokens:</strong> {baseJob.tokensUsed}
                </div>
              )}
              {baseJob.costUsd && (
                <div>
                  <strong>Cost:</strong> ${baseJob.costUsd.toFixed(4)}
                </div>
              )}
            </div>
          </Card>

          <Card title={`Compare Job (${compareJob.id})`}>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Model:</strong> {compareJob.model}
              </div>
              <div>
                <strong>Created:</strong>{' '}
                {new Date(compareJob.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Status:</strong> {compareJob.status}
              </div>
              {compareJob.tokensUsed && (
                <div>
                  <strong>Tokens:</strong> {compareJob.tokensUsed}
                </div>
              )}
              {compareJob.costUsd && (
                <div>
                  <strong>Cost:</strong> ${compareJob.costUsd.toFixed(4)}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Metrics Comparison */}
        {metricKeys.length > 0 && (
          <Card title="Metrics Comparison" className="mb-8">
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Metric
                    </th>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Base
                    </th>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Compare
                    </th>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {metricKeys.map((key) => {
                    const baseVal = baseMetrics[key];
                    const compareVal = compareMetrics[key];
                    const delta = compareVal - baseVal;
                    const improvement = isImprovement(key, delta);

                    return (
                      <tr key={key} className="hover:bg-muted/30">
                        <td className="text-foreground px-6 py-4 text-sm font-medium whitespace-nowrap">
                          {key}
                        </td>
                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                          {format(baseVal)}
                        </td>
                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                          {format(compareVal)}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              improvement
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {delta > 0 ? '+' : ''}
                            {format(delta)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Output Comparison */}
        <Card title="Output Comparison">
          <DiffViewer
            oldValue={baseJob.result || ''}
            newValue={compareJob.result || ''}
            splitView
            leftTitle="Base Job Output"
            rightTitle="Compare Job Output"
            hideLineNumbers={false}
            showDiffOnly={false}
            useDarkTheme={false}
            styles={{
              variables: {
                diffViewerBackground: 'transparent',
              },
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default DiffPage;
