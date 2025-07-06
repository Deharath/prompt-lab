import React from 'react';
import Card from '../../components/ui/Card.js';
import type { JobDetails } from './types.js';

interface UsageSectionProps {
  job: JobDetails;
}

const UsageSection: React.FC<UsageSectionProps> = ({ job }) => {
  return (
    <Card>
      <div className="p-6">
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white shadow-md">
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
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-300 dark:text-gray-200">
            Usage
          </h3>
        </div>

        {job.usage ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Input Tokens
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  {job.usage.input_tokens?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Output Tokens
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  {job.usage.output_tokens?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                No usage data available
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UsageSection;
