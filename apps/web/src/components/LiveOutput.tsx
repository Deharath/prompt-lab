import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { splitMarkdownSafe } from '../utils/splitMarkdownSafe.js';

interface LiveOutputProps {
  outputText: string;
  status: 'streaming' | 'complete' | 'error';
}

export function LiveOutput({ outputText, status }: LiveOutputProps) {
  // View mode: 'rendered' (Markdown) or 'raw' (JSON)
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  // Copy-to-clipboard feedback
  const [copied, setCopied] = useState(false);
  // For auto-scroll
  const outputRef = useRef<HTMLDivElement>(null);
  // Debounced output for Markdown rendering (for live preview)
  const [debouncedOutput, setDebouncedOutput] = useState(outputText);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Streaming-safe markdown buffers
  const [safeMarkdown, setSafeMarkdown] = useState('');
  const [tail, setTail] = useState('');
  // Track previous outputText to detect resets
  const prevOutputTextRef = useRef(outputText);
  // Use refs to track current state without causing dependency cycles
  const safeMarkdownRef = useRef('');
  const tailRef = useRef('');

  // Keep refs in sync with state
  useEffect(() => {
    safeMarkdownRef.current = safeMarkdown;
  }, [safeMarkdown]);

  useEffect(() => {
    tailRef.current = tail;
  }, [tail]);

  // Reset all internal state when outputText is cleared (new evaluation starting)
  useEffect(() => {
    if (outputText === '' && prevOutputTextRef.current !== '') {
      setSafeMarkdown('');
      setTail('');
      setDebouncedOutput('');
      safeMarkdownRef.current = '';
      tailRef.current = '';
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    }
    prevOutputTextRef.current = outputText;
  }, [outputText]);

  useEffect(() => {
    // Improved streaming debounce logic for Markdown rendering
    if (status === 'streaming') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setDebouncedOutput(outputText);
      }, 100);
      // Clean up timer on unmount or outputText/status change
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    } else {
      // On complete or error, update immediately and clear any timer
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setDebouncedOutput(outputText);
    }
  }, [outputText, status]);

  useEffect(() => {
    if (outputText === '') {
      // Reset handled by the previous useEffect
      return;
    }

    if (status === 'streaming') {
      // On each new outputText, calculate what's new and append
      const currentTotal = safeMarkdownRef.current + tailRef.current;

      if (outputText.startsWith(currentTotal)) {
        // Normal case: outputText has grown, add the new part
        const newPart = outputText.slice(currentTotal.length);
        if (newPart) {
          const combined = tailRef.current + newPart;
          const { safePart, rest } = splitMarkdownSafe(combined);
          setSafeMarkdown((prev) => prev + safePart);
          setTail(rest);
        }
      } else {
        // outputText doesn't match our current state - this means it was reset
        // Start fresh from the new outputText
        const { safePart, rest } = splitMarkdownSafe(outputText);
        setSafeMarkdown(safePart);
        setTail(rest);
      }
    } else {
      // On complete or error, flush everything
      const { safePart } = splitMarkdownSafe(outputText);
      setSafeMarkdown(safePart);
      setTail('');
    }
  }, [outputText, status]);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputText, debouncedOutput]);

  // Copy to clipboard handler
  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status indicator
  const statusIndicator = () => {
    if (status === 'streaming') {
      return (
        <span className="flex items-center space-x-1 text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-xs">Streaming...</span>
        </span>
      );
    }
    if (status === 'complete') {
      return (
        <span className="flex items-center space-x-1 text-green-500">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-xs">Complete</span>
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="flex items-center space-x-1 text-red-500">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="text-xs">Error</span>
        </span>
      );
    }
    return null;
  };

  // Cleanup effect to prevent issues during tests
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div
      className="p-8 space-y-6"
      role="region"
      aria-labelledby="output-stream-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-blue-600 text-white shadow-md"
            aria-hidden="true"
          >
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
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v11a2 2 0 002 2h8a2 2 0 002-2V7M9 7h6"
              />
            </svg>
          </div>
          <h2
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            id="output-stream-heading"
          >
            Output Stream
          </h2>
          <div className="ml-4" aria-live="polite" aria-label="Output status">
            {statusIndicator()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div
            className="flex bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700"
            role="group"
            aria-label="Output view mode"
          >
            <button
              className={`px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${viewMode === 'rendered' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setViewMode('rendered')}
              aria-pressed={viewMode === 'rendered'}
              aria-label="View as rendered markdown"
            >
              Rendered
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${viewMode === 'raw' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setViewMode('raw')}
              aria-pressed={viewMode === 'raw'}
              aria-label="View as raw text"
            >
              Raw
            </button>
          </div>
          {/* Copy button */}
          <button
            className="ml-2 px-2 py-1 rounded bg-gray-700 hover:bg-blue-600 text-white text-sm flex items-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={handleCopy}
            aria-label={
              copied ? 'Output copied to clipboard' : 'Copy output to clipboard'
            }
          >
            {copied ? (
              <span className="flex items-center">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 17h8m-4-4v8m-4-4a4 4 0 118 0 4 4 0 01-8 0z"
                  />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>
      </div>
      {/* Output area */}
      <div className="relative">
        <div
          ref={outputRef}
          className="rounded-xl p-6 min-h-[300px] max-h-[500px] overflow-auto shadow-inner transition-colors duration-300 bg-linear-to-br from-gray-900 via-gray-800 to-black dark:from-black dark:via-gray-900 dark:to-gray-800 custom-scrollbar"
          aria-live="polite"
          aria-label={`Live output stream in ${viewMode} mode`}
          role="log"
          tabIndex={0}
        >
          {viewMode === 'rendered' ? (
            <div className="prose prose-invert max-w-none">
              {/* Only render well-formed markdown */}
              {(() => {
                try {
                  return (
                    <ReactMarkdown
                      components={{
                        // Custom styling for dark theme
                        h1: ({ children, ...props }) => (
                          <h1
                            className="text-green-100 text-2xl font-bold mb-4"
                            {...props}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2
                            className="text-green-100 text-xl font-bold mb-3"
                            {...props}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3
                            className="text-green-100 text-lg font-bold mb-2"
                            {...props}
                          >
                            {children}
                          </h3>
                        ),
                        h4: ({ children, ...props }) => (
                          <h4
                            className="text-green-100 text-base font-bold mb-2"
                            {...props}
                          >
                            {children}
                          </h4>
                        ),
                        h5: ({ children, ...props }) => (
                          <h5
                            className="text-green-100 text-sm font-bold mb-2"
                            {...props}
                          >
                            {children}
                          </h5>
                        ),
                        h6: ({ children, ...props }) => (
                          <h6
                            className="text-green-100 text-xs font-bold mb-2"
                            {...props}
                          >
                            {children}
                          </h6>
                        ),
                        p: ({ children, ...props }) => (
                          <p
                            className="text-green-100 mb-4 leading-relaxed"
                            {...props}
                          >
                            {children}
                          </p>
                        ),
                        strong: ({ children, ...props }) => (
                          <strong
                            className="text-green-50 font-bold"
                            {...props}
                          >
                            {children}
                          </strong>
                        ),
                        em: ({ children, ...props }) => (
                          <em className="text-green-100 italic" {...props}>
                            {children}
                          </em>
                        ),
                        code: ({ children, ...props }) => (
                          <code
                            className="bg-gray-800 text-green-300 px-1 py-0.5 rounded text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({ children, ...props }) => (
                          <pre
                            className="bg-gray-800 text-green-300 p-4 rounded-lg overflow-x-auto mb-4"
                            {...props}
                          >
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children, ...props }) => (
                          <blockquote
                            className="border-l-4 border-green-500 pl-4 italic text-green-200 mb-4"
                            {...props}
                          >
                            {children}
                          </blockquote>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul
                            className="text-green-100 mb-4 ml-6 list-disc"
                            {...props}
                          >
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }) => (
                          <ol
                            className="text-green-100 mb-4 ml-6 list-decimal"
                            {...props}
                          >
                            {children}
                          </ol>
                        ),
                        li: ({ children, ...props }) => (
                          <li className="mb-1" {...props}>
                            {children}
                          </li>
                        ),
                        a: ({ children, ...props }) => (
                          <a
                            className="text-green-400 hover:text-green-300 underline"
                            {...props}
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {safeMarkdown}
                    </ReactMarkdown>
                  );
                } catch (_err) {
                  return (
                    <div className="text-red-400">Markdown render error</div>
                  );
                }
              })()}
            </div>
          ) : (
            <pre className="text-xs text-green-300 whitespace-pre-wrap">
              <code>{outputText}</code>
            </pre>
          )}
        </div>
        {/* Gradient overlay for readability */}
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none transition-colors duration-300 bg-linear-to-t from-gray-900 to-transparent dark:from-black"></div>
      </div>
    </div>
  );
}

export default LiveOutput;
