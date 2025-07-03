import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClient } from './api.js';
import { useJobStore } from './store/jobStore.js';
import { useDarkModeStore } from './store/darkModeStore.js';
import Card from './components/ui/Card.js';
import Button from './components/ui/Button.js';
import StatCard from './components/ui/StatCard.js';
import PromptEditor from './components/PromptEditor.js';
import InputEditor from './components/InputEditor.js';
import LiveOutput from './components/LiveOutput.js';
import ErrorAlert from './components/ErrorAlert.js';
import AppSidebar from './components/AppSidebar.js';
import DiffView from './components/DiffView.js';
import DarkModeToggle from './components/DarkModeToggle.js';
import {
  countTokens,
  estimateCompletionTokens,
  formatTokenCount,
  estimateCost,
} from './utils/tokenCounter.js';

const SAMPLE_PROMPT = `Analyze the following text and provide a summary focusing on the key points and main themes:

{{input}}

Please structure your response with:
1. Main topic
2. Key points (3-5 bullet points)
3. Overall conclusion or implications`;

const SAMPLE_INPUT = `This is a sample news article about recent developments in artificial intelligence technology. AI continues to advance rapidly across various industries, bringing both opportunities and challenges. Researchers are working on making AI systems more reliable, interpretable, and beneficial for society.`;

const Home = () => {
  const navigate = useNavigate();
  const [template, setTemplate] = useState('');
  const [inputData, setInputData] = useState('');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [error, setError] = useState('');
  const {
    current: _current,
    log,
    metrics,
    running,
    hasUserData,
    start,
    finish,
    reset,
    setUserData,
    comparison,
    // Model parameters passed to sidebar
    temperature,
    topP,
    maxTokens,
    selectedMetrics,
  } = useJobStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [outputText, setOutputText] = useState('');
  const [streamStatus, setStreamStatus] = useState<
    'streaming' | 'complete' | 'error'
  >('complete');

  // Sync outputText with job store log for Bug #7 fix
  const displayOutputText =
    log.length > 0 ? log.map((l) => l.text).join('') : outputText;

  // Track the current EventSource to allow cancellation
  const currentEventSourceRef = useRef<EventSource | null>(null);

  // Cleanup function to close any active EventSource
  const closeCurrentStream = () => {
    if (currentEventSourceRef.current) {
      currentEventSourceRef.current.close();
      currentEventSourceRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeCurrentStream();
    };
  }, []);

  // Update user data state
  useEffect(() => {
    setUserData(!!(template || inputData));
  }, [template, inputData, setUserData]);

  // Get dark mode state (HTML class sync is handled by the store)
  useDarkModeStore();

  // Calculate live token counts and cost estimates
  const promptTokens = useMemo(() => {
    if (!template || !inputData) return 0;
    // Build the final prompt by replacing {{input}} with actual input data
    const finalPrompt = template.replace(/\{\{\s*input\s*\}\}/g, inputData);
    return countTokens(finalPrompt, model);
  }, [template, inputData, model]);

  const estimatedCompletionTokens = useMemo(() => {
    if (!template || !inputData) return 0;
    const finalPrompt = template.replace(/\{\{\s*input\s*\}\}/g, inputData);
    return estimateCompletionTokens(finalPrompt, model);
  }, [template, inputData, model]);

  const totalTokens = promptTokens + estimatedCompletionTokens;
  const estimatedCost = useMemo(() => {
    if (!promptTokens) return 0;
    return estimateCost(promptTokens, estimatedCompletionTokens, model);
  }, [promptTokens, estimatedCompletionTokens, model]);

  const handleRun = async () => {
    // Close any existing stream before starting a new one
    closeCurrentStream();

    setError('');
    setOutputText('');
    setStreamStatus('streaming');

    // Build the final prompt by replacing {{input}} with actual input data
    const finalPrompt = template.replace(/\{\{\s*input\s*\}\}/g, inputData);

    try {
      reset();

      // Convert selected metric IDs to string array for API
      const metricIds = selectedMetrics.map((metric) => metric.id);

      const job = await ApiClient.createJob({
        prompt: finalPrompt,
        provider,
        model,
        temperature,
        topP,
        maxTokens: maxTokens > 0 ? maxTokens : undefined, // Only send if > 0
        metrics: metricIds.length > 0 ? metricIds : undefined, // Only send if metrics selected
      });

      start(job);
      let fullText = '';

      // Store the new EventSource reference for future cancellation
      const eventSource = ApiClient.streamJob(
        job.id,
        (token) => {
          fullText += token;
          setOutputText(fullText);
        },
        async () => {
          setStreamStatus('complete');
          currentEventSourceRef.current = null;
          try {
            const final = await ApiClient.fetchJob(job.id);
            finish((final.metrics as Record<string, number>) || {});
          } catch (_err) {
            finish({});
          }
        },
        (streamError) => {
          setStreamStatus('error');
          currentEventSourceRef.current = null;
          setError(`Stream error: ${streamError.message}`);
        },
        (metrics) => {
          finish((metrics as Record<string, number>) || {});
        },
      );

      currentEventSourceRef.current = eventSource;
    } catch (err) {
      setStreamStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Failed to run';
      setError(errorMessage);
    }
  };

  const handleStartWithExample = () => {
    setTemplate(SAMPLE_PROMPT);
    setInputData(SAMPLE_INPUT);
  };

  const isEmptyState = !template && !inputData && !hasUserData;
  const showComparison = comparison.baseJobId && comparison.compareJobId;

  const handleJobSelect = (_jobId: string) => {
    // Job loading is handled by the sidebar
  };

  const handleCompareJobs = (_baseId: string, _compareId: string) => {
    // Comparison state is managed by the store, we just need to react to it
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* History Sidebar - Bug #4 fix: Better responsive behavior */}
      <div
        className={`
        fixed lg:relative inset-y-0 left-0 z-30 
        transform transition-transform duration-300 ease-in-out
        ${sidebarCollapsed ? 'lg:w-12' : 'lg:w-80'} 
        ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
      `}
      >
        <AppSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectJob={handleJobSelect}
          onCompareJobs={handleCompareJobs}
          provider={provider}
          model={model}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onLoadTemplate={setTemplate}
          onRunEvaluation={handleRun}
          canRunEvaluation={!!(template && inputData)}
          isRunning={running}
        />
      </div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="border-b border-border bg-card/50 backdrop-blur-sm"
          role="banner"
        >
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  aria-label="Toggle job history sidebar"
                  aria-expanded={!sidebarCollapsed}
                  aria-controls="history-sidebar"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white"
                  aria-hidden="true"
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                    Prompt Lab
                  </h1>
                  <p className="text-sm text-muted hidden sm:block">
                    Evaluate and test your prompts with real-time streaming
                  </p>
                </div>
              </div>

              <nav
                className="flex items-center gap-2"
                role="navigation"
                aria-label="Main navigation"
              >
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  size="sm"
                  aria-label="Go to analytics dashboard"
                  className="hidden sm:inline-flex"
                  icon={
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  }
                >
                  Dashboard
                </Button>

                {/* Mobile dashboard button */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="sm:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  aria-label="Go to analytics dashboard"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </button>

                {/* Dark Mode Toggle */}
                <DarkModeToggle />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className="flex-1 overflow-hidden flex flex-col min-h-0"
          role="main"
        >
          {error && (
            <div
              className="flex-shrink-0 p-4 sm:p-6 pb-0"
              role="alert"
              aria-live="polite"
            >
              <ErrorAlert error={error} />
            </div>
          )}

          {showComparison ? (
            // Show comparison view when comparing jobs
            <section className="p-4 sm:p-6" aria-label="Job comparison view">
              <DiffView
                baseJobId={comparison.baseJobId!}
                compareJobId={comparison.compareJobId!}
                onClose={() => {}}
              />
            </section>
          ) : (
            // Sticky Two-Column Workspace Layout
            <section
              className="h-full flex flex-col xl:flex-row gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6"
              aria-label="Prompt evaluation workspace"
            >
              {/* Left Column - Scrollable Configuration Panel */}
              <div className="xl:w-2/5 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-24 xl:pb-4">
                  {/* Prompt Card */}
                  <Card title="Prompt Template">
                    {isEmptyState ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="text-muted mb-4" aria-hidden="true">
                          <svg
                            className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                          Create your first prompt
                        </h3>
                        <p className="text-sm sm:text-base text-muted mb-4 px-2">
                          Write a prompt template with input placeholders like{' '}
                          <code className="px-2 py-1 text-xs font-mono bg-muted/50 border border-border rounded text-foreground">
                            {'{{input}}'}
                          </code>
                        </p>
                        <Button
                          onClick={handleStartWithExample}
                          variant="primary"
                          size="sm"
                          aria-label="Load a sample prompt and input to get started"
                          className="w-full sm:w-auto"
                        >
                          Get Started!
                        </Button>
                      </div>
                    ) : (
                      <PromptEditor
                        value={template}
                        onChange={setTemplate}
                        model={model}
                      />
                    )}
                  </Card>

                  {/* Input Data Card */}
                  <Card title="Input Data">
                    {isEmptyState ? (
                      <div className="text-center py-4 sm:py-6">
                        <div className="text-muted mb-4" aria-hidden="true">
                          <svg
                            className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm sm:text-base text-muted px-2">
                          Add the data that will replace{' '}
                          <code className="px-2 py-1 text-xs font-mono bg-muted/50 border border-border rounded text-foreground">
                            {'{{input}}'}
                          </code>{' '}
                          in your prompt
                        </p>
                      </div>
                    ) : (
                      <InputEditor
                        value={inputData}
                        onChange={setInputData}
                        placeholder="Enter your input data here..."
                        model={model}
                      />
                    )}
                  </Card>

                  {/* Token Summary Card - Only show when both template and input exist */}
                  {template && inputData && (
                    <Card title="Token Summary">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">
                              Prompt Tokens:
                            </span>
                            <span className="text-sm font-mono">
                              {formatTokenCount(promptTokens)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">
                              Est. Completion:
                            </span>
                            <span className="text-sm font-mono text-muted">
                              {formatTokenCount(estimatedCompletionTokens)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-border">
                            <span className="text-sm font-medium">
                              Total Tokens:
                            </span>
                            <span className="text-sm font-mono font-medium">
                              {formatTokenCount(totalTokens)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">Model:</span>
                            <span className="text-sm font-mono">{model}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-border">
                            <span className="text-sm font-medium">
                              Est. Cost:
                            </span>
                            <span className="text-sm font-mono font-medium">
                              $
                              {estimatedCost < 0.01
                                ? '<$0.01'
                                : `$${estimatedCost.toFixed(3)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Sticky Run Button - Mobile */}
                <div className="fixed bottom-0 left-0 right-0 xl:hidden bg-background/95 backdrop-blur-sm border-t border-border p-4 z-10">
                  <Button
                    onClick={handleRun}
                    variant="primary"
                    fullWidth
                    loading={running}
                    disabled={!template || !inputData}
                    aria-describedby={
                      !template || !inputData
                        ? 'run-button-help-mobile'
                        : undefined
                    }
                  >
                    {running ? 'Running Evaluation...' : 'Run Evaluation'}
                  </Button>
                  {(!template || !inputData) && (
                    <p
                      id="run-button-help-mobile"
                      className="text-xs text-muted text-center mt-2"
                      role="status"
                    >
                      Complete both prompt template and input data
                    </p>
                  )}
                </div>

                {/* Sticky Run Button - Desktop */}
                <div className="hidden xl:block sticky bottom-6 mt-6 z-10">
                  <Button
                    onClick={handleRun}
                    variant="primary"
                    fullWidth
                    loading={running}
                    disabled={!template || !inputData}
                    aria-describedby={
                      !template || !inputData
                        ? 'run-button-help-desktop'
                        : undefined
                    }
                  >
                    {running ? 'Running Evaluation...' : 'Run Evaluation'}
                  </Button>
                  {(!template || !inputData) && (
                    <p
                      id="run-button-help-desktop"
                      className="text-xs sm:text-sm text-muted text-center mt-2"
                      role="status"
                    >
                      Complete both prompt template and input data to run
                      evaluation
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - Output Panel */}
              <div className="xl:w-3/5 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
                  {/* Live Output Card */}
                  <Card title="Live Output">
                    {displayOutputText || streamStatus === 'streaming' ? (
                      <LiveOutput
                        outputText={displayOutputText}
                        status={streamStatus}
                      />
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="text-muted mb-4" aria-hidden="true">
                          <svg
                            className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4M7 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4H17M7 4H17"
                            />
                          </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                          Ready to stream
                        </h3>
                        <p className="text-sm sm:text-base text-muted px-2">
                          Your prompt output will appear here in real-time when
                          you run an evaluation
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Evaluation Results Card */}
                  {metrics && Object.keys(metrics).length > 0 && (
                    <Card title="Evaluation Results">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Object.entries(metrics).map(([name, value]) => (
                          <StatCard
                            key={name}
                            title={name
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase())}
                            value={
                              typeof value === 'number'
                                ? value.toFixed(3)
                                : String(value)
                            }
                          />
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;
