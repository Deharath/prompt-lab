import React, { useState } from 'react';

interface InputEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const InputEditor = ({ value, onChange, placeholder }: InputEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand for large content
  const shouldAutoExpand = value.length > 200;
  const rows = isExpanded || shouldAutoExpand ? 12 : 6;

  // Rough token approximation (1 token ≈ 4 chars for English)
  const approximateTokens = Math.ceil(value.length / 4);

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > 100) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <label
            htmlFor="input-editor"
            className="block text-sm font-semibold transition-colors duration-300 text-gray-800 dark:text-gray-200"
          >
            Input Data
          </label>
        </div>

        <div className="flex items-center space-x-2">
          {/* Expand/Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 rounded-md transition-colors duration-300 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>

          {/* Word count */}
          <span className="text-xs transition-colors duration-300 text-gray-500 dark:text-gray-400">
            {value.split(/\s+/).filter((word) => word.length > 0).length} words
          </span>
        </div>
      </div>

      <div className="relative">
        <textarea
          id="input-editor"
          data-testid="input-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={
            placeholder ||
            'Enter the data you want to analyze or process...\n\nFor example:\n- News articles for summarization\n- Customer reviews for sentiment analysis\n- Code snippets for review\n- Any text content for your prompt template'
          }
          rows={rows}
          className="w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none text-sm backdrop-blur-sm transition-all duration-200 leading-relaxed border-gray-200 bg-white/80 hover:border-gray-300 focus:ring-green-500 text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800/80 dark:hover:border-gray-500 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-green-400"
        />

        {/* Character count and token approximation */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-3">
          {value.length > 1000 && (
            <div className="text-xs px-2 py-1 rounded-md transition-colors duration-300 text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/50">
              Large content
            </div>
          )}
          <div className="text-xs px-2 py-1 rounded-md transition-colors duration-300 text-gray-400 bg-white/80 dark:text-gray-500 dark:bg-gray-700/80">
            {value.length} chars
          </div>
          {value.length > 0 && (
            <div className="text-xs px-2 py-1 rounded-md transition-colors duration-300 text-gray-500 bg-white/80 dark:text-gray-400 dark:bg-gray-700/80">
              ~{approximateTokens} tokens
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Now more prominent */}
      {value.length === 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <svg
              className="h-4 w-4 transition-colors duration-300 text-gray-500 dark:text-gray-400"
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
            <span className="text-sm font-medium transition-colors duration-300 text-gray-700 dark:text-gray-300">
              Quick samples:
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                onChange(
                  'This is a sample news article about recent developments in artificial intelligence technology. AI continues to advance rapidly across various industries, bringing both opportunities and challenges. Researchers are working on making AI systems more reliable, interpretable, and beneficial for society.',
                )
              }
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:border-blue-700 dark:hover:border-blue-600"
            >
              <span>📰</span>
              <span>Sample News</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onChange(
                  'function calculateSum(a, b) {\n  return a + b;\n}\n\n// Usage example\nconst result = calculateSum(5, 3);\nconsole.log(result); // Output: 8',
                )
              }
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 dark:border-purple-700 dark:hover:border-purple-600"
            >
              <span>💻</span>
              <span>Sample Code</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onChange(
                  'I love this product! The quality is amazing and the customer service was exceptional. Highly recommend to anyone looking for a reliable solution. The delivery was fast and the packaging was perfect.',
                )
              }
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 hover:border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 dark:border-green-700 dark:hover:border-green-600"
            >
              <span>💬</span>
              <span>Sample Review</span>
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {!value && (
        <div className="text-xs p-3 rounded-lg transition-colors duration-300 text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/50">
          💡 <strong>Tip:</strong> This is where you put the actual content that
          will replace{' '}
          <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{`{{input}}`}</code>{' '}
          in your prompt template. Paste large articles, documents, or any text
          you want to analyze.
        </div>
      )}
    </div>
  );
};

export default InputEditor;
