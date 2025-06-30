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

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity ${
        open ? '' : 'pointer-events-none'
      }`}
    >
      <div
        className={`absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-y-0 right-0 w-80 max-w-full transform bg-white shadow-xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
          <div className="space-x-2 flex items-center">
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
              className={`text-sm ${compareMode ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-800`}
            >
              {compareMode ? 'Cancel' : 'Compare'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {history.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => handleSelect(job.id)}
              className={`w-full text-left p-2 rounded-md border border-gray-200 hover:bg-gray-50 ${
                job.id === comparison.baseJobId ||
                job.id === comparison.compareJobId
                  ? 'bg-blue-50 border-blue-200'
                  : ''
              }`}
            >
              <div className="flex justify-between">
                <span className="font-mono text-sm">{job.id}</span>
                <span className="text-xs text-gray-600">
                  {job.id === comparison.baseJobId
                    ? 'Base'
                    : job.id === comparison.compareJobId
                      ? 'Compare'
                      : job.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryDrawer;
