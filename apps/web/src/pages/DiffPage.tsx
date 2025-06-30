import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DiffViewer from 'react-diff-viewer-continued';
import { ApiClient, type JobDetails } from '../api.js';
import { useJobStore } from '../store/jobStore.js';

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
    return <div className="p-4">Loading diff...</div>;
  }

  const { baseJob, compareJob } = diff;
  const baseMetrics = (baseJob.metrics as Record<string, number>) || {};
  const compareMetrics = (compareJob.metrics as Record<string, number>) || {};
  const metricKeys = Array.from(
    new Set([...Object.keys(baseMetrics), ...Object.keys(compareMetrics)]),
  );

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <button
        type="button"
        onClick={() => {
          clearComparison();
          navigate('/');
        }}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back
      </button>
      <h2 className="text-lg font-semibold text-gray-900">Job Diff</h2>
      <DiffViewer
        oldValue={baseJob.result || ''}
        newValue={compareJob.result || ''}
        splitView
        leftTitle={`Job ${baseJob.id}`}
        rightTitle={`Job ${compareJob.id}`}
      />
      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-2">
          Metric Delta
        </h3>
        <div className="overflow-auto rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compare
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delta
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metricKeys.map((key) => {
                const baseVal = baseMetrics[key];
                const compareVal = compareMetrics[key];
                const delta = (compareVal ?? 0) - (baseVal ?? 0);
                const improvement = isImprovement(key, delta);
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {key}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {format(baseVal)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {format(compareVal)}
                    </td>
                    <td
                      className={`px-4 py-2 text-sm font-medium ${improvement ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {format(delta)}
                    </td>
                  </tr>
                );
              })}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                  Cost (USD)
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {format(baseJob.costUsd ?? undefined)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {format(compareJob.costUsd ?? undefined)}
                </td>
                <td
                  className={`px-4 py-2 text-sm font-medium ${isImprovement('cost', (compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0)) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {format((compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0))}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                  Tokens Used
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {baseJob.tokensUsed ?? 'N/A'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {compareJob.tokensUsed ?? 'N/A'}
                </td>
                <td
                  className={`px-4 py-2 text-sm font-medium ${isImprovement('token', (compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0)) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {(compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DiffPage;
