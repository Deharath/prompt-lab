import { useState } from 'react';
import { format } from 'date-fns';
import { type JobSummary } from '../../../api.js';
import { useJobsData } from '../../../hooks/useJobsData.js';

import { useJobStore } from '../../../store/jobStore.js';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

const HistoryDrawer = ({ open, onClose }: HistoryDrawerProps) => {
  const {
    setBaseJob: _setBaseJob,
    setCompareJob: _setCompareJob,
    clearComparison: _clearComparison,
  } = useJobStore();

  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const { data: jobs = [] } = useJobsData();

  const handleJobSelect = (jobId: string) => {
    if (isCompareMode) {
      if (selectedJobs.includes(jobId)) {
        setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
      } else if (selectedJobs.length < 2) {
        setSelectedJobs([...selectedJobs, jobId]);
      }
    } else {
      // Regular job selection logic
      onClose();
    }
  };

  const handleCompareClick = () => {
    setIsCompareMode(!isCompareMode);
    setSelectedJobs([]);
  };

  if (!open) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 bg-black">
      <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-xl">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Job History</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              �
            </button>
          </div>
          <button
            onClick={handleCompareClick}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            {isCompareMode ? 'Cancel Compare' : 'Compare'}
          </button>
        </div>
        <div className="h-full overflow-y-auto pb-20">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`border-b p-4 hover:bg-gray-50 ${
                selectedJobs.includes(job.id) ? 'bg-blue-50' : ''
              }`}
            >
              <div
                className="cursor-pointer"
                onClick={() => handleJobSelect(job.id)}
              >
                <div className="text-sm text-gray-600">Job #{job.id}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {format(job.createdAt, 'MMM d, yyyy, h:mm:ss a')}
                </div>
                <div className="text-xs text-gray-500">
                  {job.provider} " {job.model}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryDrawer;
