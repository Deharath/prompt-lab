import React from 'react';
import PromptEditor from '../../features/prompt/PromptEditor.js';
import InputEditor from '../../features/prompt/InputEditor.js';

interface UnifiedPanelInputProps {
  template: string;
  inputData: string;
  onTemplateChange: (value: string) => void;
  onInputDataChange: (value: string) => void;
  model: string;
  onStartWithExample: () => void;
  isEmptyState: boolean;
}

export const UnifiedPanelInput = ({
  template,
  inputData,
  onTemplateChange,
  onInputDataChange,
  model,
  onStartWithExample,
  isEmptyState,
}: UnifiedPanelInputProps) => (
  <div className="space-y-6">
    {isEmptyState ? (
      <div className="py-8 text-center">
        <div className="text-muted-foreground mb-4" aria-hidden="true">
          <svg
            className="mx-auto mb-4 h-12 w-12 opacity-60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-foreground mb-2 text-lg font-semibold">
          Create your first prompt
        </h3>
        <p className="text-muted-foreground mx-auto mb-6 max-w-md">
          Write a prompt template with input placeholders like{' '}
          <code className="bg-muted/50 border-border text-foreground rounded border px-2 py-1 font-mono text-xs">
            {'{{input}}'}
          </code>
        </p>
        <button
          onClick={onStartWithExample}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-colors"
        >
          Get Started!
        </button>
      </div>
    ) : (
      <>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <svg
                className="h-4 w-4 text-blue-600 dark:text-blue-400"
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
            <h4 className="text-foreground text-sm font-semibold">
              Prompt Template
            </h4>
          </div>
          <PromptEditor
            value={template}
            onChange={onTemplateChange}
            model={model}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <svg
                className="h-4 w-4 text-green-600 dark:text-green-400"
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
            </div>
            <h4 className="text-foreground text-sm font-semibold">
              Input Data
            </h4>
          </div>
          <InputEditor
            value={inputData}
            onChange={onInputDataChange}
            placeholder="Enter your input data here..."
            model={model}
          />
        </div>
      </>
    )}
  </div>
);
