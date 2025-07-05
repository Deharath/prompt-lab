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
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs">Streaming...</span>
        </span>
      );
    }
    if (status === 'complete') {
      return (
        <span className="flex items-center space-x-1 text-green-500">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs">Complete</span>
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="flex items-center space-x-1 text-red-500">
          <span className="w-2 h-2 bg-red-500 rounded-full" />
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
      className="space-y-4"
      role="region"
      aria-labelledby="output-stream-heading"
    >
      {/* Header - Bug #10 fix */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2
            className="text-lg font-semibold text-foreground"
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
            className="flex bg-muted rounded-lg overflow-hidden border border-border"
            role="group"
            aria-label="Output view mode"
          >
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${viewMode === 'rendered' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('rendered')}
              aria-pressed={viewMode === 'rendered'}
              aria-label="View as rendered markdown"
            >
              Rendered
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${viewMode === 'raw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('raw')}
              aria-pressed={viewMode === 'raw'}
              aria-label="View as raw text"
            >
              Raw
            </button>
          </div>
          {/* Copy button */}
          <button
            className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-sm flex items-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-border"
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
      {/* Output area - Bug #10 fix */}
      <div className="relative">
        <div
          ref={outputRef}
          className="rounded-lg p-6 min-h-[300px] max-h-[500px] overflow-auto border border-border bg-card transition-colors duration-200 scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
          aria-live="polite"
          aria-label={`Live output stream in ${viewMode} mode`}
          role="log"
          tabIndex={0}
        >
          {viewMode === 'rendered' ? (
            <div className="prose prose-sm max-w-none text-foreground">
              {/* Only render well-formed markdown */}
              {(() => {
                try {
                  return (
                    <ReactMarkdown
                      components={{
                        // Custom styling to match site theme
                        h1: ({ children, ...props }) => (
                          <h1
                            className="text-foreground text-2xl font-bold mb-4 border-b border-border pb-2"
                            {...props}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2
                            className="text-foreground text-xl font-semibold mb-3"
                            {...props}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3
                            className="text-foreground text-lg font-semibold mb-2"
                            {...props}
                          >
                            {children}
                          </h3>
                        ),
                        h4: ({ children, ...props }) => (
                          <h4
                            className="text-foreground text-base font-semibold mb-2"
                            {...props}
                          >
                            {children}
                          </h4>
                        ),
                        h5: ({ children, ...props }) => (
                          <h5
                            className="text-foreground text-sm font-semibold mb-2"
                            {...props}
                          >
                            {children}
                          </h5>
                        ),
                        h6: ({ children, ...props }) => (
                          <h6
                            className="text-foreground text-xs font-semibold mb-2"
                            {...props}
                          >
                            {children}
                          </h6>
                        ),
                        p: ({ children, ...props }) => (
                          <p
                            className="text-foreground mb-4 leading-relaxed"
                            {...props}
                          >
                            {children}
                          </p>
                        ),
                        strong: ({ children, ...props }) => (
                          <strong
                            className="text-foreground font-semibold"
                            {...props}
                          >
                            {children}
                          </strong>
                        ),
                        em: ({ children, ...props }) => (
                          <em className="text-foreground italic" {...props}>
                            {children}
                          </em>
                        ),
                        code: ({ children, ...props }) => (
                          <code
                            className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono border border-border"
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({ children, ...props }) => (
                          <pre
                            className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto mb-4 border border-border"
                            {...props}
                          >
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children, ...props }) => (
                          <blockquote
                            className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4"
                            {...props}
                          >
                            {children}
                          </blockquote>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul
                            className="text-foreground mb-4 ml-6 list-disc"
                            {...props}
                          >
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }) => (
                          <ol
                            className="text-foreground mb-4 ml-6 list-decimal"
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
                            className="text-primary hover:text-primary/80 underline"
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
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none transition-colors duration-300 bg-linear-to-t from-gray-900 to-transparent dark:from-black" />
      </div>
    </div>
  );
}

export default LiveOutput;
