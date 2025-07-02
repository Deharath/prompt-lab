import { useEffect, useState } from 'react';
import { fetchJob } from '../api.js';
import { useJobStore } from '../store/jobStore.js';
import { useNavigate } from 'react-router-dom';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

const HistoryDrawer = ({ open, onClose }: HistoryDrawerProps) => {
  const {
    history,
    loadHistory,
    start,
    append,
    finish,
    reset,
    comparison,
    setBaseJob,
    setCompareJob,
    clearComparison,
  } = useJobStore();
  const navigate = useNavigate();
  const [compareMode, setCompareMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      const result = loadHistory();
      if (result && typeof result.finally === 'function') {
        result.finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [loadHistory, open]);

  const handleSelect = async (id: string) => {
    if (compareMode) {
      if (!comparison.baseJobId) {
        clearComparison();
        setBaseJob(id);
      } else if (!comparison.compareJobId) {
        setCompareJob(id);
        onClose();
        navigate('/diff');
      } else {
        clearComparison();
        setBaseJob(id);
      }
      return;
    }

    try {
      reset();
      const job = await fetchJob(id);
      start({ id: job.id, status: job.status });
      if (job.result) {
        append(job.result);
      }
      finish((job.metrics as Record<string, number>) || {});
      onClose();
    } catch (err) {
      console.error('Failed to load job', err);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
      </div>

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-96 max-w-full transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="relative bg-linear-to-r from-blue-600 via-purple-600 to-blue-700 p-6">
          <div className="absolute inset-0 bg-linear-to-r from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Job History</h2>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (compareMode) {
                    setCompareMode(false);
                    clearComparison();
                  } else {
                    setCompareMode(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  compareMode
                    ? 'bg-white/20 text-white ring-2 ring-white/30'
                    : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white'
                }`}
              >
                {compareMode ? 'Cancel' : 'Compare'}
              </button>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/90 hover:bg-white/20 hover:text-white transition-all duration-200"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="space-y-4 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600">Loading history...</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-3 h-full overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      No history yet
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Run your first evaluation to see results here
                    </p>
                  </div>
                </div>
              ) : (
                history.map((job) => {
                  const isSelected =
                    job.id === comparison.baseJobId ||
                    job.id === comparison.compareJobId;
                  const selectionType =
                    job.id === comparison.baseJobId
                      ? 'Base'
                      : job.id === comparison.compareJobId
                        ? 'Compare'
                        : null;

                  // Create a meaningful display name from job ID and timestamp
                  const jobTime = new Date(
                    parseInt(job.id.substring(0, 8), 16) * 1000,
                  ).toLocaleString();
                  const shortId = job.id.substring(0, 8);

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => handleSelect(job.id)}
                      className={`group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 shadow-md'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                job.status === 'completed'
                                  ? 'bg-green-400'
                                  : job.status === 'running'
                                    ? 'bg-blue-400 animate-pulse'
                                    : job.status === 'failed'
                                      ? 'bg-red-400'
                                      : 'bg-gray-400'
                              }`}
                            ></div>
                            <span className="text-sm font-medium text-gray-900">
                              Job #{shortId}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                job.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : job.status === 'running'
                                    ? 'bg-blue-100 text-blue-800'
                                    : job.status === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {job.status}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 mb-2">
                            {jobTime}
                          </div>

                          {/* Job description placeholder - this could be enhanced with actual prompt preview */}
                          <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                            Click to view details and metrics
                          </div>

                          {selectionType && (
                            <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {selectionType}
                            </div>
                          )}
                        </div>

                        <div className="ml-2 flex items-center">
                          <svg
                            className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {compareMode && comparison.baseJobId && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600 text-center">
              {comparison.compareJobId
                ? 'Both jobs selected. Click Compare to view diff.'
                : 'Select a second job to compare.'}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HistoryDrawer;
