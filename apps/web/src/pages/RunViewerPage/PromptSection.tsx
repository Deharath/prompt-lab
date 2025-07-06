import React from 'react';
import Card from '../../components/ui/Card.js';
import type { JobDetails } from './types.js';

interface PromptSectionProps {
  job: JobDetails;
}

const PromptSection: React.FC<PromptSectionProps> = ({ job }) => {
  return (
    <Card>
      <div className="p-6">
        <div className="mb-4 flex items-center space-x-3">
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
          <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-300 dark:text-gray-200">
            Prompt
          </h3>
        </div>
        <div
          className="min-h-[120px] w-full rounded-xl border-2 border-gray-200/50 bg-gray-50/50 p-4 font-mono text-sm text-gray-700 transition-colors duration-300 dark:border-gray-600/50 dark:bg-gray-800/50 dark:text-gray-300"
          aria-disabled="true"
        >
          {job.prompt || 'No prompt available'}
        </div>
      </div>
    </Card>
  );
};

export default PromptSection;
