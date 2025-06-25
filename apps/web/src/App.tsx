import { useState } from 'react';
// eslint-disable-next-line import/extensions
import PromptEditor from './components/PromptEditor.js';
// eslint-disable-next-line import/extensions
import RunButton from './components/RunButton.js';
// eslint-disable-next-line import/extensions
import ResultsTable from './components/ResultsTable.js';
// eslint-disable-next-line import/extensions
import ModelSelector from './components/ModelSelector.js';

interface EvalResult {
  perItem: unknown[];
  aggregates: { avgCosSim: number };
}

const App = () => {
  const [template, setTemplate] = useState('');
  const [model, setModel] = useState('gpt-4.1-mini');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<EvalResult | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptTemplate: template,
          model,
          testSetId: 'news-summaries',
        }),
      });
      if (!resp.ok) throw new Error('Request failed');
      const data = (await resp.json()) as EvalResult;
      setResult(data);
    } catch (err) {
      setError('Failed to run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div role="alert" data-testid="error-toast">
          {error}
        </div>
      )}
      <PromptEditor value={template} onChange={setTemplate} />
      <ModelSelector model={model} onChange={setModel} />
      <RunButton onRun={handleRun} loading={loading} />
      {loading && <div data-testid="spinner">Loading...</div>}
      {result && (
        <ResultsTable
          perItemCount={result.perItem.length}
          avgCosSim={result.aggregates.avgCosSim}
        />
      )}
    </div>
  );
};

export default App;
