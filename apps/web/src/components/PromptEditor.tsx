interface Props {
  value: string;
  onChange: (val: string) => void;
}

const PromptEditor = ({ value, onChange }: Props) => (
  <div className="space-y-2">
    <label
      htmlFor="prompt-editor"
      className="block text-sm font-medium text-gray-700"
    >
      Prompt Template
    </label>
    <textarea
      id="prompt-editor"
      data-testid="prompt-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your prompt template here. Use {{input}} for variable substitution..."
      rows={6}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
    />
  </div>
);

export default PromptEditor;
