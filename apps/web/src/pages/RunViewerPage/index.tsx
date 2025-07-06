import { useRunViewer } from './useRunViewer.js';
import { LoadingState } from './LoadingState.js';
import { ErrorState } from './ErrorState.js';
import RunViewerHeader from './RunViewerHeader.js';
import JobInfoSection from './JobInfoSection.js';
import PromptSection from './PromptSection.js';
import ConfigurationSection from './ConfigurationSection.js';
import { OutputSection } from './OutputSection.js';
import ResultsSection from './ResultsSection.js';
import UsageSection from './UsageSection.js';

const RunViewerPage = () => {
  const { job, loading, error } = useRunViewer();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !job) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      {/* Header */}
      <RunViewerHeader jobId={job.id} />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Job Info Header */}
        <JobInfoSection job={job} />

        {/* Prompt Section */}
        <PromptSection job={job} />

        {/* Configuration Section */}
        <ConfigurationSection job={job} />

        {/* Results/Output Section */}
        <OutputSection job={job} />

        {/* Metrics Section */}
        <ResultsSection job={job} />

        {/* Usage Info */}
        <UsageSection job={job} />
      </div>
    </div>
  );
};

export default RunViewerPage;
