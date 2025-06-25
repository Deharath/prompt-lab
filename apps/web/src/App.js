import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
// eslint-disable-next-line import/extensions
import PromptEditor from './components/PromptEditor.js';
// eslint-disable-next-line import/extensions
import RunButton from './components/RunButton.js';
// eslint-disable-next-line import/extensions
import ResultsTable from './components/ResultsTable.js';
// eslint-disable-next-line import/extensions
import ModelSelector from './components/ModelSelector.js';
const App = () => {
    const [template, setTemplate] = useState('');
    const [model, setModel] = useState('gpt-4.1-mini');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
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
            if (!resp.ok)
                throw new Error('Request failed');
            const data = (await resp.json());
            setResult(data);
        }
        catch (err) {
            setError('Failed to run');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { children: [error && (_jsx("div", { role: "alert", "data-testid": "error-toast", children: error })), _jsx(PromptEditor, { value: template, onChange: setTemplate }), _jsx(ModelSelector, { model: model, onChange: setModel }), _jsx(RunButton, { onRun: handleRun, loading: loading }), loading && _jsx("div", { "data-testid": "spinner", children: "Loading..." }), result && (_jsx(ResultsTable, { perItemCount: result.perItem.length, avgCosSim: result.aggregates.avgCosSim }))] }));
};
export default App;
