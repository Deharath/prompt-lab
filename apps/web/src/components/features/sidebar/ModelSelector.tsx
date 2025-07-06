interface Props {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  compact?: boolean;
}

const modelsByProvider = {
  openai: ['gpt-4o-mini', 'gpt-4.1-mini'],
  gemini: ['gemini-2.5-flash'],
};

const ModelSelector = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  compact = false,
}: Props) => (
  <div className={compact ? 'space-y-2' : 'space-y-6'}>
    {/* Provider Selection */}
    <div className={compact ? 'flex items-center gap-3' : 'space-y-3'}>
      <label
        htmlFor="provider-select"
        className={`${compact ? 'text-foreground min-w-[4rem] text-sm font-medium whitespace-nowrap' : 'text-foreground block text-sm font-semibold'} transition-colors duration-300`}
      >
        Provider
      </label>

      <div className="relative min-w-0 flex-1">
        <select
          id="provider-select"
          data-testid="provider-select"
          value={provider}
          onChange={(e) => {
            onProviderChange(e.target.value);
            // Auto-select first model for new provider
            const newProvider = e.target.value as keyof typeof modelsByProvider;
            const availableModels = modelsByProvider[newProvider];
            if (availableModels && availableModels.length > 0) {
              onModelChange(availableModels[0]);
            }
          }}
          className={`w-full min-w-0 appearance-none rounded-xl border-2 border-gray-200 bg-white/80 text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-100 dark:[color-scheme:dark] dark:hover:border-gray-500 dark:focus:ring-blue-400 ${
            compact ? 'px-3 py-2 text-sm' : 'px-4 py-3'
          }`}
          aria-describedby="provider-help"
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
        </select>

        {/* Custom dropdown arrow */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4 text-gray-400 transition-colors duration-300 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {!compact && (
        <p id="provider-help" className="sr-only">
          Choose an AI provider. Model options will update automatically based
          on your selection.
        </p>
      )}
    </div>

    {/* Model Selection */}
    <div className={compact ? 'flex items-center gap-3' : 'space-y-3'}>
      <label
        htmlFor="model-select"
        className={`${compact ? 'text-foreground min-w-[4rem] text-sm font-medium whitespace-nowrap' : 'text-foreground block text-sm font-semibold'} transition-colors duration-300`}
      >
        Model
      </label>

      <div className="relative min-w-0 flex-1">
        <select
          id="model-select"
          data-testid="model-select"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className={`w-full min-w-0 appearance-none rounded-xl border-2 border-gray-200 bg-white/80 text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-100 dark:[color-scheme:dark] dark:hover:border-gray-500 dark:focus:ring-blue-400 ${
            compact ? 'px-3 py-2 text-sm' : 'px-4 py-3'
          }`}
          aria-describedby="model-help"
        >
          {modelsByProvider[provider as keyof typeof modelsByProvider]?.map(
            (m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ),
          )}
        </select>

        {/* Custom dropdown arrow */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4 text-gray-400 transition-colors duration-300 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {!compact && (
        <p id="model-help" className="sr-only">
          Select a specific model from the{' '}
          {provider === 'openai' ? 'OpenAI' : 'Google'} provider for your
          evaluation.
        </p>
      )}
    </div>

    {/* Model Info - Only show in non-compact mode */}
    {!compact && (
      <div className="rounded-lg border border-blue-200/50 bg-blue-50/80 p-3 backdrop-blur-sm transition-colors duration-300 dark:border-blue-700/50 dark:bg-blue-900/30">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 transition-colors duration-300 dark:bg-blue-400" />
          <span className="text-xs font-medium text-blue-800 transition-colors duration-300 dark:text-blue-300">
            {provider === 'openai' ? 'OpenAI' : 'Google'} • {model}
          </span>
        </div>
      </div>
    )}
  </div>
);

export default ModelSelector;
