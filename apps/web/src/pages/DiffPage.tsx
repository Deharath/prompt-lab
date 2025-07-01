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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('prompt-lab-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('prompt-lab-dark-mode', JSON.stringify(!darkMode));
  };

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
      <div
        className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gradient-to-br from-gray-900 via-slate-900 to-black' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}
      >
        <div
          className={`p-8 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
        >
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading diff...</span>
          </div>
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
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gradient-to-br from-gray-900 via-slate-900 to-black' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}
    >
      {/* Header */}
      <div
        className={`shadow-lg border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800/90 backdrop-blur-sm border-gray-700/50' : 'bg-white/80 backdrop-blur-sm border-white/20'}`}
      >
        <div className="mx-auto max-w-7xl px-6 py-6">
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
              <h1
                className={`text-2xl font-bold transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
              >
                Job Comparison
              </h1>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`group flex items-center justify-center w-10 h-10 rounded-xl shadow-md ring-1 transition-all focus-ring ${darkMode ? 'bg-gray-700/80 ring-gray-600/50 hover:bg-gray-700 hover:ring-blue-400/50' : 'bg-white/80 ring-gray-200/50 hover:bg-white hover:ring-blue-300/50'}`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg
                  className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl p-6 space-y-8">
        {/* Diff Viewer */}
        <Card>
          <div
            className={`px-6 py-4 border-b transition-colors duration-300 ${darkMode ? 'border-gray-700/50 bg-gray-800/80' : 'border-gray-200/50 bg-gray-50/80'}`}
          >
            <h2
              className={`text-lg font-semibold transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
            >
              Output Comparison: Base Job {baseJob.id} vs Compare Job{' '}
              {compareJob.id}
            </h2>
          </div>
          <div className="p-6">
            <DiffViewer
              oldValue={baseJob.result || ''}
              newValue={compareJob.result || ''}
              splitView
              leftTitle={`Job ${baseJob.id}`}
              rightTitle={`Job ${compareJob.id}`}
              useDarkTheme={darkMode}
              styles={{
                variables: darkMode
                  ? {
                      dark: {
                        diffViewerBackground: '#1f2937',
                        diffViewerColor: '#e5e7eb',
                        addedBackground: '#065f46',
                        addedColor: '#d1fae5',
                        removedBackground: '#7f1d1d',
                        removedColor: '#fecaca',
                        wordAddedBackground: '#047857',
                        wordRemovedBackground: '#dc2626',
                        addedGutterBackground: '#065f46',
                        removedGutterBackground: '#7f1d1d',
                        gutterBackground: '#374151',
                        gutterBackgroundDark: '#1f2937',
                        highlightBackground: '#374151',
                        highlightGutterBackground: '#4b5563',
                      },
                    }
                  : undefined,
              }}
            />
          </div>
        </Card>

        {/* Metrics Comparison */}
        <Card>
          <div
            className={`px-6 py-4 border-b transition-colors duration-300 ${darkMode ? 'border-gray-700/50 bg-gray-800/80' : 'border-gray-200/50 bg-gray-50/80'}`}
          >
            <h3
              className={`text-lg font-semibold transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
            >
              Metric Comparison
            </h3>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead
                className={`transition-colors duration-300 ${darkMode ? 'bg-gray-800/80' : 'bg-gray-50'}`}
              >
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Metric
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Base
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Compare
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y transition-colors duration-300 ${darkMode ? 'bg-gray-800/50 divide-gray-700' : 'bg-white divide-gray-200'}`}
              >
                {metricKeys.map((key) => {
                  const baseVal = baseMetrics[key];
                  const compareVal = compareMetrics[key];
                  const delta = (compareVal ?? 0) - (baseVal ?? 0);
                  const improvement = isImprovement(key, delta);
                  return (
                    <tr
                      key={key}
                      className={`transition-colors duration-300 ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                    >
                      <td
                        className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
                      >
                        {key}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      >
                        {format(baseVal)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      >
                        {format(compareVal)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-medium ${improvement ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {delta > 0 ? '+' : ''}
                        {format(delta)}
                      </td>
                    </tr>
                  );
                })}
                <tr
                  className={`transition-colors duration-300 ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                >
                  <td
                    className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
                  >
                    Cost (USD)
                  </td>
                  <td
                    className={`px-6 py-4 text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {format(baseJob.costUsd ?? undefined)}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {format(compareJob.costUsd ?? undefined)}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-medium ${isImprovement('cost', (compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0)) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {(compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0) > 0
                      ? '+'
                      : ''}
                    {format((compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0))}
                  </td>
                </tr>
                <tr
                  className={`transition-colors duration-300 ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                >
                  <td
                    className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
                  >
                    Tokens Used
                  </td>
                  <td
                    className={`px-6 py-4 text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {baseJob.tokensUsed ?? 'N/A'}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {compareJob.tokensUsed ?? 'N/A'}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-medium ${isImprovement('token', (compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0)) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {(compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0) >
                    0
                      ? '+'
                      : ''}
                    {(compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DiffPage;
