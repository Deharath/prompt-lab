interface Props {
  value: string;
  onChange: (val: string) => void;
}

const PromptEditor = ({ value, onChange }: Props) => (
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
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      <label
        htmlFor="prompt-editor"
        className="block text-sm font-semibold transition-colors duration-300 text-gray-800 dark:text-gray-200"
      >
        Prompt Template
      </label>
    </div>
    <div className="relative">
      <textarea
        id="prompt-editor"
        data-testid="prompt-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your prompt template here. Use {{input}} for variable substitution...

Example:
Analyze the following text and provide a summary:

{{input}}

Please focus on the key points and main themes."
        rows={8}
        className="w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm backdrop-blur-sm transition-all duration-200 border-gray-200 bg-white/80 hover:border-gray-300 text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800/80 dark:hover:border-gray-500 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400"
      />
      <div className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-md transition-colors duration-300 text-gray-400 bg-white/80 dark:text-gray-500 dark:bg-gray-700/80">
        {value.length} characters
      </div>
    </div>
  </div>
);

export default PromptEditor;
