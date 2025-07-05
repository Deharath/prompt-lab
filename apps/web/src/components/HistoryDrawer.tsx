import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ApiClient, type JobSummary } from '../api.js';
import { useJobStore } from '../store/jobStore.js';

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

  const { data: jobs = [] } = useQuery<JobSummary[]>({
    queryKey: ['jobs'],
    queryFn: ApiClient.listJobs,
  });

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
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
        <div className="overflow-y-auto h-full pb-20">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedJobs.includes(job.id) ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleJobSelect(job.id)}
            >
              <div className="text-sm text-gray-600">Job #{job.id}</div>
              <div className="text-xs text-gray-500 mt-1">
                {format(job.createdAt, 'MMM d, yyyy, h:mm:ss a')}
              </div>
              <div className="text-xs text-gray-500">
                {job.provider} " {job.model}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryDrawer;
