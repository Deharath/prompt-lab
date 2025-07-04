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
  const { job, loading, error, darkMode, toggleDarkMode } = useRunViewer();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !job) {
    return <ErrorState error={error} />;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'dark bg-linear-to-br from-gray-900 via-slate-900 to-black'
          : 'bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}
    >
      {/* Header */}
      <RunViewerHeader
        jobId={job.id}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        {/* Job Info Header */}
        <JobInfoSection job={job} darkMode={darkMode} />

        {/* Prompt Section */}
        <PromptSection job={job} darkMode={darkMode} />

        {/* Configuration Section */}
        <ConfigurationSection job={job} darkMode={darkMode} />

        {/* Results/Output Section */}
        <OutputSection job={job} darkMode={darkMode} />

        {/* Metrics Section */}
        <ResultsSection job={job} darkMode={darkMode} />

        {/* Usage Info */}
        <UsageSection job={job} darkMode={darkMode} />
      </div>
    </div>
  );
};

export default RunViewerPage;
