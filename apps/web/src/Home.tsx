import { useState, useEffect } from 'react';
import { ApiClient } from './api.js';
import { useJobStore } from './store/jobStore.js';
import ConfigurationPanel from './components/ConfigurationPanel.js';
import LiveOutputPanel from './components/LiveOutputPanel.js';
import ResultsPanel from './components/ResultsPanel.js';
import DebugPanel from './components/DebugPanel.js';
import ErrorAlert from './components/ErrorAlert.js';
import HistoryDrawer from './components/HistoryDrawer.js';
import QuickStartGuide from './components/QuickStartGuide.js';
import WelcomeCard from './components/WelcomeCard.js';
import Button from './components/ui/Button.js';

const Home = () => {
  const [template, setTemplate] = useState('');
  const [inputData, setInputData] = useState('');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [error, setError] = useState('');
  const {
    log,
    metrics,
    running,
    hasUserData,
    start,
    append,
    finish,
    reset,
    setUserData,
  } = useJobStore();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('prompt-lab-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Show quick start guide for new users (no template and no history)
  useEffect(() => {
    const hasUsedBefore = localStorage.getItem('prompt-lab-used');
    if (!hasUsedBefore && !template) {
      setShowQuickStart(true);
    }
    // Update user data state
    setUserData(!!(template || inputData));
  }, [template, inputData, setUserData]);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('prompt-lab-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleRun = async () => {
    // Mark as used
    localStorage.setItem('prompt-lab-used', 'true');

    console.log('🚀 Run button clicked!');
    setError('');

    // Build the final prompt by replacing {{input}} with actual input data
    const finalPrompt = template.replace(/\{\{\s*input\s*\}\}/g, inputData);

    try {
      reset();
      console.log('📝 Creating job with:', {
        prompt: finalPrompt,
        provider,
        model,
      });

      const job = await ApiClient.createJob({
        prompt: finalPrompt,
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

  const handleGetStarted = () => {
    // Pre-populate with sample prompt and data
    setTemplate(`Analyze the following text and provide a summary focusing on the key points and main themes:

{{input}}

Please structure your response with:
1. Main topic
2. Key points (3-5 bullet points)
3. Overall conclusion or implications`);

    setInputData(
      'This is a sample news article about recent developments in artificial intelligence technology. AI continues to advance rapidly across various industries, bringing both opportunities and challenges. Researchers are working on making AI systems more reliable, interpretable, and beneficial for society.',
    );

    localStorage.setItem('prompt-lab-used', 'true');
    setShowQuickStart(false);
  };

  const handleQuickStartTemplate = (newTemplate: string) => {
    setTemplate(newTemplate);
    localStorage.setItem('prompt-lab-used', 'true');
    setShowQuickStart(false);
  };

  return (
    <div
      className={`min-h-screen animate-fade-in transition-colors duration-300 ${darkMode ? 'dark bg-gradient-to-br from-gray-900 via-slate-900 to-black' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}
    >
      {/* Enhanced Header */}
      <div
        className={`relative shadow-lg border-b transition-colors duration-300 animate-slide-up ${darkMode ? 'bg-gray-800/90 backdrop-blur-sm border-gray-700/50' : 'bg-white/80 backdrop-blur-sm border-white/20'}`}
      >
        <div
          className={`absolute inset-0 transition-colors duration-300 ${darkMode ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10' : 'bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5'}`}
        ></div>
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg animate-float">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1
                  className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent text-shadow transition-colors duration-300 ${darkMode ? 'from-gray-100 via-blue-300 to-purple-300' : 'from-gray-900 via-blue-800 to-purple-800'}`}
                >
                  Prompt Lab
                </h1>
                <p
                  className={`font-medium transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  Evaluate and test your prompts with real-time streaming
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Header Actions Group */}
              <div className="flex items-center space-x-2">
                {/* Debug Panel Toggle (DEV only) */}
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    onClick={() => setDebugOpen(!debugOpen)}
                    variant={debugOpen ? 'primary' : 'tertiary'}
                    size="sm"
                    icon={
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
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    }
                  >
                    Debug
                  </Button>
                )}

                <Button
                  onClick={() => setHistoryOpen(true)}
                  variant="tertiary"
                  size="sm"
                  icon={
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                >
                  History
                </Button>

                <Button
                  onClick={() => setShowQuickStart(true)}
                  variant="tertiary"
                  size="sm"
                  icon={
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
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                >
                  Guide
                </Button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className={`group flex items-center justify-center w-10 h-10 rounded-xl shadow-md ring-1 transition-all focus-ring ${darkMode ? 'bg-gray-700/80 ring-gray-600/50 hover:bg-gray-700 hover:ring-blue-400/50' : 'bg-white/80 ring-gray-200/50 hover:bg-white hover:ring-blue-300/50'}`}
                title={
                  darkMode ? 'Switch to light mode' : 'Switch to dark mode'
                }
              >
                {darkMode ? (
                  <svg
                    className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Debug Panel Overlay */}
        {debugOpen && process.env.NODE_ENV === 'development' && (
          <div
            className={`border-t transition-colors duration-300 ${darkMode ? 'border-gray-700/50 bg-gray-800/95' : 'border-gray-200/50 bg-white/95'}`}
          >
            <div className="mx-auto max-w-7xl px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-lg font-semibold transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
                >
                  Debug Panel
                </h3>
                <button
                  type="button"
                  onClick={() => setDebugOpen(false)}
                  className={`rounded-lg p-1 transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <DebugPanel
                running={running}
                log={log}
                metrics={metrics}
                provider={provider}
                model={model}
                template={template}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {error && (
          <div className="animate-scale-in">
            <ErrorAlert error={error} />
          </div>
        )}

        <div className="space-y-8">
          {/* Configuration Section */}
          {!template && !inputData && !hasUserData ? (
            <div
              className="animate-slide-up"
              style={{ animationDelay: '100ms' }}
            >
              <WelcomeCard onGetStarted={handleGetStarted} />
            </div>
          ) : (
            <div
              className="animate-slide-up"
              style={{ animationDelay: '100ms' }}
            >
              <ConfigurationPanel
                template={template}
                inputData={inputData}
                provider={provider}
                model={model}
                running={running}
                onTemplateChange={setTemplate}
                onInputDataChange={setInputData}
                onProviderChange={setProvider}
                onModelChange={setModel}
                onRun={handleRun}
              />
            </div>
          )}

          {/* Live Output Section */}
          {(log.length > 0 || running) && (
            <div
              className="animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              <LiveOutputPanel log={log} running={running} />
            </div>
          )}

          {/* Results Section */}
          {metrics && Object.keys(metrics).length > 0 && (
            <div
              className="animate-scale-in"
              style={{ animationDelay: '300ms' }}
            >
              <ResultsPanel metrics={metrics} />
            </div>
          )}
        </div>
      </div>

      {historyOpen && (
        <HistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {showQuickStart && (
        <QuickStartGuide
          onClose={() => setShowQuickStart(false)}
          onExampleLoad={handleQuickStartTemplate}
        />
      )}
    </div>
  );
};

export default Home;
