import { useState } from 'react';
import PromptEditor from './components/PromptEditor.js';
import RunButton from './components/RunButton.js';
import ModelSelector from './components/ModelSelector.js';
import { createJob, streamJob, fetchJob } from './api.js';
import { useJobStore } from './store/jobStore.js';

const App = () => {
  const [template, setTemplate] = useState('');
  const [model, setModel] = useState('gpt-4.1-mini');
  const [error, setError] = useState('');
  const { log, metrics, running, start, append, finish, reset } = useJobStore();

  const handleRun = async () => {
    setError('');
    try {
      reset();
      const job = await createJob({
        prompt: template,
        provider: 'openai',
        model,
        testSetId: 'news-summaries',
      });
      start(job);
      streamJob(
        job.id,
        (line) => append(line),
        async () => {
          try {
            const final = await fetchJob(job.id);
            finish(final.metrics || {});
          } catch (err) {
            console.error('Failed to fetch final job result:', err);
            finish({});
          }
        },
      );
    } catch (_err) {
      setError('Failed to run');
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Prompt Lab</h1>
          <p className="text-gray-600 mt-1">
            Evaluate and test your prompts with real-time streaming
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            data-testid="error-toast"
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <PromptEditor value={template} onChange={setTemplate} />
            </div>
            <ModelSelector model={model} onChange={setModel} />
            <div className="flex items-end">
              <RunButton onRun={handleRun} loading={running} />
            </div>
          </div>
        </div>

        {/* Live Output Panel */}
        {log.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Live Output
              </h2>
              {running && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Streaming...</span>
                </div>
              )}
            </div>
            <div className="bg-gray-900 rounded-md p-4 h-64 overflow-auto">
              <div className="text-green-400 font-mono text-sm space-y-1">
                {log.map((l, i) => (
                  <div key={i} className="whitespace-pre-wrap">
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {metrics && Object.keys(metrics).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Results</h2>
            <div className="overflow-hidden rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(metrics).map(([name, score]) => (
                    <tr key={name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {typeof score === 'number' ? score.toFixed(3) : score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
