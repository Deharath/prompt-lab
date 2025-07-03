import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchJob } from '../api.js';
import type { JobDetails } from '../api.js';
import Card from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';
import LoadingSpinner from '../components/LoadingSpinner.js';
import ErrorMessage from '../components/ErrorMessage.js';
import ShareRunButton from '../components/ShareRunButton.js';
import ResultsPanel from '../components/ResultsPanel.js';

const RunViewerPage = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('prompt-lab-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const loadJob = async () => {
      if (!id) {
        setError('Job ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const jobData = (await fetchJob(id)) as JobDetails;
        setJob(jobData);

        // Set page title
        if (jobData.prompt) {
          const truncatedPrompt =
            jobData.prompt.length > 48
              ? `${jobData.prompt.slice(0, 48)}…`
              : jobData.prompt;
          document.title = `Run · ${truncatedPrompt}`;
        } else {
          document.title = `Run · ${id}`;
        }
      } catch (err) {
        console.error('Failed to load job:', err);
        setError('Run not found');
        document.title = 'Run not found';
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('prompt-lab-dark-mode', JSON.stringify(!darkMode));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-black transition-colors duration-300">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-black transition-colors duration-300">
        <div className="text-center space-y-4">
          <ErrorMessage message={error || 'Run not found'} />
          <Button
            onClick={() => (window.location.href = '/')}
            variant="primary"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'dark bg-linear-to-br from-gray-900 via-slate-900 to-black'
          : 'bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}
    >
      {/* Header */}
      <div
        className={`shadow-lg border-b transition-colors duration-300 ${
          darkMode
            ? 'bg-gray-800/90 backdrop-blur-sm border-gray-700/50'
            : 'bg-white/80 backdrop-blur-sm border-white/20'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => (window.location.href = '/')}
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
              <div>
                <h1
                  className={`text-2xl font-bold transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  Run Viewer
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Share Button */}
              <ShareRunButton jobId={job.id} />

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className={`group flex items-center justify-center w-10 h-10 rounded-xl shadow-md ring-1 transition-all focus-ring ${
                  darkMode
                    ? 'bg-gray-700/80 ring-gray-600/50 hover:bg-gray-700 hover:ring-blue-400/50'
                    : 'bg-white/80 ring-gray-200/50 hover:bg-white hover:ring-blue-300/50'
                }`}
                title={
                  darkMode ? 'Switch to light mode' : 'Switch to dark mode'
                }
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
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        {/* Job Info Header */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    job.status === 'completed'
                      ? 'bg-green-400'
                      : job.status === 'running'
                        ? 'bg-blue-400'
                        : job.status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-gray-400'
                  }`}
                />
                <h2
                  className={`text-xl font-semibold transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  Run #{job.id.substring(0, 8)}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                      : job.status === 'running'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                        : job.status === 'failed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    darkMode
                      ? 'bg-blue-900/50 text-blue-400'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {job.provider}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    darkMode
                      ? 'bg-purple-900/50 text-purple-400'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {job.model}
                </span>
              </div>
            </div>

            {/* Created Date */}
            <div
              className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Created:{' '}
              {new Date(
                parseInt(job.id.substring(0, 8), 16) * 1000,
              ).toLocaleString()}
            </div>
          </div>
        </Card>

        {/* Prompt Section */}
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600 text-white shadow-md">
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                Prompt
              </h3>
            </div>
            <div
              className={`w-full min-h-[120px] p-4 rounded-xl border-2 font-mono text-sm transition-colors duration-300 ${
                darkMode
                  ? 'bg-gray-800/50 border-gray-600/50 text-gray-300'
                  : 'bg-gray-50/50 border-gray-200/50 text-gray-700'
              }`}
              aria-disabled="true"
            >
              {job.prompt || 'No prompt available'}
            </div>
          </div>
        </Card>

        {/* Configuration Section */}
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-md">
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Provider Selector (Disabled) */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Provider
                </label>
                <select
                  value={job.provider}
                  disabled
                  aria-disabled="true"
                  className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors duration-300 cursor-not-allowed opacity-60 ${
                    darkMode
                      ? 'bg-gray-800/50 border-gray-600/50 text-gray-400'
                      : 'bg-gray-50/50 border-gray-200/50 text-gray-500'
                  }`}
                >
                  <option value={job.provider}>{job.provider}</option>
                </select>
              </div>

              {/* Model Selector (Disabled) */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Model
                </label>
                <select
                  value={job.model}
                  disabled
                  aria-disabled="true"
                  className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors duration-300 cursor-not-allowed opacity-60 ${
                    darkMode
                      ? 'bg-gray-800/50 border-gray-600/50 text-gray-400'
                      : 'bg-gray-50/50 border-gray-200/50 text-gray-500'
                  }`}
                >
                  <option value={job.model}>{job.model}</option>
                </select>
              </div>
            </div>

            {/* Run Button (Disabled) */}
            <div className="mt-6">
              <Button
                disabled
                aria-disabled="true"
                variant="primary"
                size="lg"
                fullWidth
                icon={
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                }
              >
                Run Evaluation (Read-Only)
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        {job.result && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-emerald-600 text-white shadow-md">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3
                    className={`text-lg font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                  >
                    Output
                  </h3>
                </div>
                <ShareRunButton jobId={job.id} />
              </div>

              <div
                className={`w-full min-h-[200px] p-4 rounded-xl border-2 font-mono text-sm whitespace-pre-wrap transition-colors duration-300 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-600/50 text-gray-300'
                    : 'bg-gray-50/50 border-gray-200/50 text-gray-700'
                }`}
                role="region"
                aria-label="Job output"
              >
                {job.result}
              </div>
            </div>
          </Card>
        )}

        {/* Metrics Section */}
        <ResultsPanel metrics={job.metrics} jobId={job.id} />

        {/* Usage Info */}
        {(job.tokensUsed || job.costUsd) && (
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-md">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <h3
                  className={`text-lg font-semibold transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  Usage
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.tokensUsed && (
                  <div
                    className={`p-4 rounded-xl border transition-colors duration-300 ${
                      darkMode
                        ? 'bg-gray-800/30 border-gray-700/50'
                        : 'bg-gray-50/30 border-gray-200/50'
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      Tokens Used
                    </div>
                    <div
                      className={`text-xl font-bold transition-colors duration-300 ${
                        darkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}
                    >
                      {job.tokensUsed.toLocaleString()}
                    </div>
                  </div>
                )}
                {job.costUsd && (
                  <div
                    className={`p-4 rounded-xl border transition-colors duration-300 ${
                      darkMode
                        ? 'bg-gray-800/30 border-gray-700/50'
                        : 'bg-gray-50/30 border-gray-200/50'
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      Cost (USD)
                    </div>
                    <div
                      className={`text-xl font-bold transition-colors duration-300 ${
                        darkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}
                    >
                      ${job.costUsd.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RunViewerPage;
