import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { diffJobs, type JobDetails } from './api.js';
import { useJobStore } from './store/jobStore.js';

interface DiffResponse {
  baseJob: JobDetails;
  compareJob: JobDetails;
}

const DiffPage = () => {
  const navigate = useNavigate();
  const { comparison, clearComparison } = useJobStore();
  const [diff, setDiff] = useState<DiffResponse | null>(null);

  useEffect(() => {
    const { baseJobId, compareJobId } = comparison;
    if (!baseJobId || !compareJobId) {
      navigate('/');
      return;
    }
    diffJobs(baseJobId, compareJobId)
      .then(setDiff)
      .catch((err) => {
        console.error('Failed to load diff', err);
      });
  }, [comparison, navigate]);

  if (!diff) {
    return <div className="p-4">Loading diff...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">
            Base Job {diff.baseJob.id}
          </h3>
          <pre className="bg-gray-100 p-2 rounded-md whitespace-pre-wrap text-sm">
            {diff.baseJob.prompt}
          </pre>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">
            Compare Job {diff.compareJob.id}
          </h3>
          <pre className="bg-gray-100 p-2 rounded-md whitespace-pre-wrap text-sm">
            {diff.compareJob.prompt}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DiffPage;
