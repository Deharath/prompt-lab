import React from 'react';
import ReactMarkdown from 'react-markdown';

interface LiveOutputDisplayProps {
  outputRef: React.RefObject<HTMLDivElement | null>;
  viewMode: 'rendered' | 'raw';
  safeMarkdown: string;
  outputText: string;
}

export const LiveOutputDisplay: React.FC<LiveOutputDisplayProps> = ({
  outputRef,
  viewMode,
  safeMarkdown,
  outputText,
}) => (
  <div className="relative">
    <div
      ref={outputRef}
      className="border-border bg-card scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 max-h-[500px] min-h-[300px] overflow-auto rounded-lg border p-6 transition-colors duration-200"
      aria-live="polite"
      aria-label={`Live output stream in ${viewMode} mode`}
      role="log"
      tabIndex={0}
    >
      {viewMode === 'rendered' ? (
        <div className="prose prose-sm text-foreground max-w-none">
          {(() => {
            try {
              return (
                <ReactMarkdown
                  components={{
                    h1: ({ children, ...props }) => (
                      <h1
                        className="text-foreground border-border mb-4 border-b pb-2 text-2xl font-bold"
                        {...props}
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2
                        className="text-foreground mb-3 text-xl font-semibold"
                        {...props}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3
                        className="text-foreground mb-2 text-lg font-semibold"
                        {...props}
                      >
                        {children}
                      </h3>
                    ),
                    h4: ({ children, ...props }) => (
                      <h4
                        className="text-foreground mb-2 text-base font-semibold"
                        {...props}
                      >
                        {children}
                      </h4>
                    ),
                    h5: ({ children, ...props }) => (
                      <h5
                        className="text-foreground mb-2 text-sm font-semibold"
                        {...props}
                      >
                        {children}
                      </h5>
                    ),
                    h6: ({ children, ...props }) => (
                      <h6
                        className="text-foreground mb-2 text-xs font-semibold"
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
                        className="bg-muted text-foreground border-border rounded border px-1.5 py-0.5 font-mono text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    ),
                    pre: ({ children, ...props }) => (
                      <pre
                        className="bg-muted text-foreground border-border mb-4 overflow-x-auto rounded-lg border p-4"
                        {...props}
                      >
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        className="border-primary text-muted-foreground mb-4 border-l-4 pl-4 italic"
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
              return <div className="text-red-400">Markdown render error</div>;
            }
          })()}
        </div>
      ) : (
        <pre className="text-xs whitespace-pre-wrap text-green-300">
          <code>{outputText}</code>
        </pre>
      )}
    </div>
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-linear-to-t from-gray-900 to-transparent transition-colors duration-300 dark:from-black" />
  </div>
);
