interface Props {
  model: string;
  onChange: (model: string) => void;
}

const ModelSelector = ({ model, onChange }: Props) => (
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
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
    >
      <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
    </select>
  </div>
);

export default ModelSelector;
