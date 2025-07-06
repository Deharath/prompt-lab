import React from 'react';
import Card from '../../components/ui/Card.js';
import type { JobDetails } from './types.js';

interface JobInfoSectionProps {
  job: JobDetails;
}

const JobInfoSection: React.FC<JobInfoSectionProps> = ({ job }) => {
  return (
    <Card>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`h-3 w-3 rounded-full ${
                job.status === 'completed'
                  ? 'bg-green-400'
                  : job.status === 'running'
                    ? 'bg-blue-400'
                    : job.status === 'failed'
                      ? 'bg-red-400'
                      : 'bg-gray-400'
              }`}
            />
            <h2 className="text-xl font-semibold text-gray-900 transition-colors duration-300 dark:text-gray-200">
              Run #{job.id.substring(0, 8)}
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
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
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
              {job.provider}
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-900/50 dark:text-purple-400">
              {job.model}
            </span>
          </div>
        </div>

        {/* Created Date */}
        <div className="text-sm text-gray-600 transition-colors duration-300 dark:text-gray-400">
          Created:{' '}
          {new Date(
            parseInt(job.id.substring(0, 8), 16) * 1000,
          ).toLocaleString()}
        </div>
      </div>
    </Card>
  );
};

export default JobInfoSection;
