import { useState } from 'react';
import { ApiClient } from './api.js';
import { useJobStore } from './store/jobStore.js';
import ConfigurationPanel from './components/ConfigurationPanel.js';
import LiveOutputPanel from './components/LiveOutputPanel.js';
import ResultsPanel from './components/ResultsPanel.js';
import DebugPanel from './components/DebugPanel.js';
import ErrorAlert from './components/ErrorAlert.js';
import HistoryDrawer from './components/HistoryDrawer.js';

const App = () => {
  const [template, setTemplate] = useState('');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [error, setError] = useState('');
  const { log, metrics, running, start, append, finish, reset } = useJobStore();
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleRun = async () => {
    console.log('🚀 Run button clicked!');
    setError('');
    try {
      reset();
      console.log('📝 Creating job with:', {
        prompt: template,
        provider,
        model,
      });

      const job = await ApiClient.createJob({
        prompt: template,
        provider,
        model,
      });

      console.log('✅ Job created:', job);
      start(job);

      ApiClient.streamJob(
        job.id,
        (line) => {
          console.log('📨 Stream message:', line);
          append(line);
        },
        async () => {
          console.log('🏁 Stream ended, fetching final results');
          try {
            const final = await ApiClient.fetchJob(job.id);
            console.log('📊 Final results:', final);
            finish((final.metrics as Record<string, number>) || {});
          } catch (err) {
            console.error('Failed to fetch final job result:', err);
            finish({});
          }
        },
        (streamError) => {
          console.error('❌ Stream error:', streamError);
          setError(`Stream error: ${streamError.message}`);
          reset();
        },
      );
    } catch (err) {
      console.error('❌ Job creation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to run';
      setError(errorMessage);
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prompt Lab</h1>
            <p className="text-gray-600 mt-1">
              Evaluate and test your prompts with real-time streaming
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            History
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <ErrorAlert error={error} />

        <ConfigurationPanel
          template={template}
          provider={provider}
          model={model}
          running={running}
          onTemplateChange={setTemplate}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onRun={handleRun}
        />

        <DebugPanel
          running={running}
          log={log}
          metrics={metrics}
          provider={provider}
          model={model}
          template={template}
        />

        <LiveOutputPanel log={log} running={running} />

        <ResultsPanel metrics={metrics} />
      </div>
      {historyOpen && (
        <HistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
