import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApiClient, fetchJob } from './api.js';
import { useJobStore } from './store/jobStore.js';
import { useDarkModeStore } from './store/darkModeStore.js';
import { useToggle } from './hooks/useUtilities.js';
import Button from './components/ui/Button.js';
import UnifiedPanel from './components/UnifiedPanel.js';
import ModernLiveOutput from './components/ModernLiveOutput.js';
import ErrorAlert from './components/ErrorAlert.js';
import AppSidebar from './components/AppSidebar.js';
import DiffView from './components/DiffView.js';
import DarkModeToggle from './components/DarkModeToggle.js';
import {
  countTokens,
  estimateCompletionTokens,
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
  const location = useLocation();
  const [template, setTemplate] = useState('');
  const [inputData, setInputData] = useState('');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, toggleMobileMenu] = useToggle(false);
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

      // Send the full selectedMetrics array with IDs and input data
      const metricsToSend =
        selectedMetrics.length > 0 ? selectedMetrics : undefined;

      const job = await ApiClient.createJob({
        prompt: finalPrompt,
        template,
        inputData,
        provider,
        model,
        temperature,
        topP,
        maxTokens: maxTokens > 0 ? maxTokens : undefined, // Only send if > 0
        metrics: metricsToSend, // Send full metric objects with potential input data
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
            finish((final.metrics as Record<string, unknown>) || {});
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
          // Don't cast to Record<string, number> as metrics can include complex objects
          finish((metrics as Record<string, unknown>) || {});
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

  const handleJobSelect = async (jobId: string) => {
    try {
      // Fetch the job details to get the template and input data
      const jobDetails = await fetchJob(jobId);

      // Load the job's template and input data if available
      if (jobDetails.template && jobDetails.inputData) {
        // Use the stored template and input data directly
        setTemplate(jobDetails.template);
        setInputData(jobDetails.inputData);
      } else if (jobDetails.prompt) {
        // Fallback: if template/input not stored, use the prompt as template
        setTemplate(jobDetails.prompt);
        setInputData('');
      }

      // Update the provider and model to match the job
      setProvider(jobDetails.provider);
      setModel(jobDetails.model);
    } catch (error) {
      console.error('Failed to load job details:', error);
      setError('Failed to load job details');
    }
  };

  const handleCompareJobs = (_baseId: string, _compareId: string) => {
    // Comparison state is managed by the store, we just need to react to it
  };

  // Navigation items for the header
  const navigationItems = [
    {
      href: '/',
      label: 'Home',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z',
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
  ];

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sticky Sidebar - Always visible on desktop, overlay on mobile */}
      <div
        className={`
          sticky top-0 h-screen z-30 flex-shrink-0
          lg:static lg:z-auto
          transform transition-transform duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-80 lg:w-80'} 
          ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          bg-background border-r border-border
          lg:translate-x-0
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
          // Token summary data
          promptTokens={promptTokens}
          estimatedCompletionTokens={estimatedCompletionTokens}
          totalTokens={totalTokens}
          estimatedCost={estimatedCost}
          template={template}
          inputData={inputData}
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

      {/* Fixed Navigation - Always centered relative to viewport */}
      <div className="fixed left-1/2 transform -translate-x-1/2 top-4 hidden md:flex z-50">
        <nav className="flex items-center space-x-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-2">
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
                    d={item.icon}
                  />
                </svg>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Navigation Header - Always visible */}
        <header className="sticky top-0 z-40 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left Side - Title and Mobile Toggle */}
            <div className="flex items-center space-x-4 flex-1">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors lg:hidden"
                aria-label="Toggle job history sidebar"
                aria-expanded={!sidebarCollapsed}
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

              {/* Title - Only visible on small screens */}
              <div className="flex items-center md:hidden">
                <h1 className="text-lg font-semibold text-foreground">
                  Prompt evaluation workspace
                </h1>
              </div>
            </div>

            {/* Spacer for desktop navigation (fixed positioning) */}
            <div className="hidden md:block flex-1"></div>

            {/* Right Side - Token Info and Controls */}
            <div className="flex items-center space-x-3 flex-1 justify-end">
              {/* Always visible Token Summary */}
              <div className="hidden sm:flex items-center gap-6 text-sm bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Prompt Tokens:
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {promptTokens > 0 ? promptTokens.toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Est. Output:
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {estimatedCompletionTokens > 0
                      ? estimatedCompletionTokens.toLocaleString()
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2 border-l border-border pl-6">
                  <span className="text-xs font-medium text-muted-foreground">
                    Total Tokens:
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {totalTokens > 0 ? totalTokens.toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Estimated Cost:
                  </span>
                  <span className="font-mono font-bold text-green-600 dark:text-green-400">
                    {estimatedCost > 0
                      ? estimatedCost < 0.01
                        ? '<$0.01'
                        : `$${estimatedCost.toFixed(4)}`
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden h-10 w-10"
                aria-label="Toggle navigation menu"
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
                    d={
                      mobileMenuOpen
                        ? 'M6 18L18 6M6 6l12 12'
                        : 'M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z'
                    }
                  />
                </svg>
              </Button>

              {/* Dark Mode Toggle */}
              <DarkModeToggle />
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-border bg-card md:hidden">
              <nav className="px-4 py-3 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={toggleMobileMenu}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
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
                          d={item.icon}
                        />
                      </svg>
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </header>

        {/* Single Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Error Alert */}
          {error && (
            <div className="p-4 sm:p-6 pb-0" role="alert" aria-live="polite">
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
            // Two-Column Modern Workspace Layout
            <section
              className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 sm:p-6 items-start min-h-0 w-full max-w-full"
              aria-label="Prompt evaluation workspace"
            >
              {/* Left Column - Unified Input & Results Panel */}
              <div className="w-full lg:w-2/5 lg:max-w-[40%] flex-shrink-0 min-w-0">
                <UnifiedPanel
                  template={template}
                  inputData={inputData}
                  onTemplateChange={setTemplate}
                  onInputDataChange={setInputData}
                  model={model}
                  onStartWithExample={handleStartWithExample}
                  isEmptyState={isEmptyState}
                  metrics={metrics}
                  hasResults={!!(metrics && Object.keys(metrics).length > 0)}
                />
              </div>

              {/* Right Column - Modern Live Output */}
              <div className="w-full lg:w-3/5 lg:max-w-[60%] space-y-4 sm:space-y-6 min-w-0">
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 h-[600px]">
                    {displayOutputText || streamStatus === 'streaming' ? (
                      <ModernLiveOutput
                        outputText={displayOutputText}
                        status={streamStatus}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div
                          className="text-muted-foreground mb-4"
                          aria-hidden="true"
                        >
                          <svg
                            className="h-16 w-16 mx-auto mb-4 opacity-60"
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
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Ready to stream
                        </h3>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
