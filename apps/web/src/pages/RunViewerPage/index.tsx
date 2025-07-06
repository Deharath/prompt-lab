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
import { useDarkModeStore } from '../../store/darkModeStore.js';

const RunViewerPage = () => {
  const { job, loading, error } = useRunViewer();
  const { isDarkMode } = useDarkModeStore();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !job) {
    return <ErrorState error={error} />;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? 'dark bg-linear-to-br from-gray-900 via-slate-900 to-black'
          : 'bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}
    >
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
