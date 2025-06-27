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

const ModelSelector = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}: Props) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label
        htmlFor="provider-select"
        className="block text-sm font-medium text-gray-700"
      >
        Provider
      </label>
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
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
      </select>
    </div>

    <div className="space-y-2">
      <label
        htmlFor="model-select"
        className="block text-sm font-medium text-gray-700"
      >
        Model
      </label>
      <select
        id="model-select"
        data-testid="model-select"
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {modelsByProvider[provider as keyof typeof modelsByProvider]?.map(
          (m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ),
        )}
      </select>
    </div>
  </div>
);

export default ModelSelector;
