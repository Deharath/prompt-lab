import React from 'react';
import Card from '../../components/ui/Card.js';
import ShareRunButton from '../../components/ShareRunButton.js';
import ResultsPanel from '../../components/ResultsPanel.js';
import type { JobDetails } from './types.js';

interface ResultsSectionProps {
  job: JobDetails;
  darkMode: boolean;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ job, darkMode }) => {
  if (!job.result) return null;

  return (
    <>
      {/* Output Section */}
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

      {/* Metrics Section */}
      <ResultsPanel metrics={job.metrics} jobId={job.id} />
    </>
  );
};

export default ResultsSection;
