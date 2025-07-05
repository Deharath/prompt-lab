import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { splitMarkdownSafe } from '../utils/splitMarkdownSafe.js';

interface ModernLiveOutputProps {
  outputText: string;
  status: 'streaming' | 'complete' | 'error';
}

export function ModernLiveOutput({
  outputText,
  status,
}: ModernLiveOutputProps) {
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
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs font-medium">Streaming...</span>
        </div>
      );
    }
    if (status === 'complete') {
      return (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium">Complete</span>
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-xs font-medium">Error</span>
        </div>
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
    <div className="flex h-full flex-col">
      {/* Modern Header */}
      <div className="border-border/50 flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
            <svg
              className="h-4 w-4 text-purple-600 dark:text-purple-400"
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
          <h2 className="text-foreground text-sm font-semibold">Live Output</h2>
          <div aria-live="polite" aria-label="Output status">
            {statusIndicator()}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle - Modern pill design */}
          <div className="bg-muted/50 border-border/50 flex overflow-hidden rounded-lg border">
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                viewMode === 'rendered'
                  ? 'bg-background text-foreground border-border/50 border-r shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
              onClick={() => setViewMode('rendered')}
            >
              Markdown
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                viewMode === 'raw'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
              onClick={() => setViewMode('raw')}
            >
              Raw
            </button>
          </div>

          {/* Copy button - Modern design */}
          <button
            className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50 flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200"
            onClick={handleCopy}
            aria-label={
              copied ? 'Output copied to clipboard' : 'Copy output to clipboard'
            }
          >
            {copied ? (
              <>
                <svg
                  className="h-3 w-3"
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
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modern Output Area - No more window-in-window */}
      <div className="flex-1 pt-4">
        <div
          ref={outputRef}
          className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/40 h-full overflow-auto transition-all duration-200"
          aria-live="polite"
          aria-label={`Live output stream in ${viewMode} mode`}
          role="log"
          tabIndex={0}
        >
          {viewMode === 'rendered' ? (
            <div className="prose prose-sm max-w-none">
              {(() => {
                try {
                  return (
                    <ReactMarkdown
                      components={{
                        // Modern typography components matching the new design
                        h1: ({ children, ...props }) => (
                          <h1
                            className="text-foreground border-border/50 mb-4 border-b pb-2 text-xl font-bold"
                            {...props}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2
                            className="text-foreground mb-3 text-lg font-semibold"
                            {...props}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3
                            className="text-foreground mb-2 text-base font-semibold"
                            {...props}
                          >
                            {children}
                          </h3>
                        ),
                        h4: ({ children, ...props }) => (
                          <h4
                            className="text-foreground mb-2 text-sm font-semibold"
                            {...props}
                          >
                            {children}
                          </h4>
                        ),
                        h5: ({ children, ...props }) => (
                          <h5
                            className="text-foreground mb-2 text-sm font-medium"
                            {...props}
                          >
                            {children}
                          </h5>
                        ),
                        h6: ({ children, ...props }) => (
                          <h6
                            className="text-foreground mb-2 text-xs font-medium"
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
                            className="bg-muted text-foreground border-border/50 rounded border px-2 py-0.5 font-mono text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({ children, ...props }) => (
                          <pre
                            className="bg-muted text-foreground border-border/50 mb-4 overflow-x-auto rounded-lg border p-4"
                            {...props}
                          >
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children, ...props }) => (
                          <blockquote
                            className="border-primary/50 text-muted-foreground bg-muted/20 mb-4 rounded-r border-l-4 py-2 pl-4 italic"
                            {...props}
                          >
                            {children}
                          </blockquote>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul
                            className="text-foreground mb-4 ml-6 list-disc space-y-1"
                            {...props}
                          >
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }) => (
                          <ol
                            className="text-foreground mb-4 ml-6 list-decimal space-y-1"
                            {...props}
                          >
                            {children}
                          </ol>
                        ),
                        li: ({ children, ...props }) => (
                          <li className="leading-relaxed" {...props}>
                            {children}
                          </li>
                        ),
                        a: ({ children, ...props }) => (
                          <a
                            className="text-primary hover:text-primary/80 underline underline-offset-2"
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
                    <div className="text-sm text-red-500">
                      Markdown render error
                    </div>
                  );
                }
              })()}
            </div>
          ) : (
            <pre className="text-foreground font-mono text-xs leading-relaxed whitespace-pre-wrap">
              <code>{outputText}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModernLiveOutput;
