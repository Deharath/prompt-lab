interface Props {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}

const modelsByProvider = {
  openai: ['gpt-4o-mini', 'gpt-4.1-mini'],
  gemini: ['gemini-2.5-flash'],
};

const providerIcons = {
  openai: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.078 6.078 0 0 0 6.514 2.9A5.973 5.973 0 0 0 12.282 24a5.973 5.973 0 0 0 4.532-2.012 6.078 6.078 0 0 0 6.514-2.9 5.98 5.98 0 0 0 .51-4.911 5.985 5.985 0 0 0-1.556-4.356z" />
    </svg>
  ),
  gemini: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L19 7L14.74 12L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12L5 7L10.91 8.26L12 2Z" />
    </svg>
  ),
};

const ModelSelector = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}: Props) => (
  <div className="space-y-6">
    {/* Provider Selection */}
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <svg
          className="h-5 w-5 transition-colors duration-300 text-gray-600 dark:text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
        <label
          htmlFor="provider-select"
          className="block text-sm font-semibold transition-colors duration-300 text-gray-800 dark:text-gray-200"
        >
          AI Provider
        </label>
      </div>

      <div className="relative">
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
          className="w-full appearance-none px-4 py-3 border-2 rounded-xl backdrop-blur-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:ring-2 transition-all duration-200 border-gray-200 bg-white/80 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:border-gray-600 dark:bg-gray-800/80 dark:hover:border-gray-500 dark:text-gray-100 dark:focus:ring-blue-400"
          aria-describedby="provider-help"
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
        </select>

        {/* Custom dropdown arrow */}
        <div
          className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4 transition-colors duration-300 text-gray-400 dark:text-gray-500"
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
      <p id="provider-help" className="sr-only">
        Choose an AI provider. Model options will update automatically based on
        your selection.
      </p>
    </div>

    {/* Model Selection */}
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div
          className="transition-colors duration-300 text-gray-600 dark:text-gray-400"
          aria-hidden="true"
        >
          {providerIcons[provider as keyof typeof providerIcons]}
        </div>
        <label
          htmlFor="model-select"
          className="block text-sm font-semibold transition-colors duration-300 text-gray-800 dark:text-gray-200"
        >
          Model
        </label>
      </div>

      <div className="relative">
        <select
          id="model-select"
          data-testid="model-select"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full appearance-none px-4 py-3 border-2 rounded-xl backdrop-blur-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:ring-2 transition-all duration-200 border-gray-200 bg-white/80 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:border-gray-600 dark:bg-gray-800/80 dark:hover:border-gray-500 dark:text-gray-100 dark:focus:ring-blue-400"
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
          className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4 transition-colors duration-300 text-gray-400 dark:text-gray-500"
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
      <p id="model-help" className="sr-only">
        Select a specific model from the{' '}
        {provider === 'openai' ? 'OpenAI' : 'Google'} provider for your
        evaluation.
      </p>
    </div>

    {/* Model Info */}
    <div className="p-3 rounded-lg border backdrop-blur-sm transition-colors duration-300 bg-blue-50/80 border-blue-200/50 dark:bg-blue-900/30 dark:border-blue-700/50">
      <div className="flex items-center space-x-2">
        <div className="h-2 w-2 rounded-full transition-colors duration-300 bg-blue-500 dark:bg-blue-400"></div>
        <span className="text-xs font-medium transition-colors duration-300 text-blue-800 dark:text-blue-300">
          {provider === 'openai' ? 'OpenAI' : 'Google'} • {model}
        </span>
      </div>
    </div>
  </div>
);

export default ModelSelector;
