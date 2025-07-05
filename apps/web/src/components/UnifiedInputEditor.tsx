import { useState } from 'react';
import Card from './ui/Card.js';
import Button from './ui/Button.js';
import PromptEditor from './PromptEditor.js';
import InputEditor from './InputEditor.js';

interface UnifiedInputEditorProps {
  template: string;
  inputData: string;
  onTemplateChange: (value: string) => void;
  onInputDataChange: (value: string) => void;
  model: string;
  onStartWithExample: () => void;
  isEmptyState: boolean;
}

type ActiveTab = 'prompt' | 'input';

const UnifiedInputEditor = ({
  template,
  inputData,
  onTemplateChange,
  onInputDataChange,
  model,
  onStartWithExample,
  isEmptyState,
}: UnifiedInputEditorProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('prompt');

  if (isEmptyState) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-muted mb-4" aria-hidden="true">
            <svg
              className="h-12 w-12 mx-auto mb-4"
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
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Create your first prompt
          </h3>
          <p className="text-base text-muted mb-4 px-2">
            Write a prompt template with input placeholders like{' '}
            <code className="px-2 py-1 text-xs font-mono bg-muted/50 border border-border rounded text-foreground">
              {'{{input}}'}
            </code>
          </p>
          <Button
            onClick={onStartWithExample}
            variant="primary"
            size="sm"
            aria-label="Load a sample prompt and input to get started"
          >
            Get Started!
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'prompt'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Prompt Template
        </button>
        <button
          onClick={() => setActiveTab('input')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'input'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Input Data
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-0">
        {activeTab === 'prompt' ? (
          <div>
            <PromptEditor
              value={template}
              onChange={onTemplateChange}
              model={model}
            />
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mt-2">
                Use{' '}
                <code className="px-2 py-1 text-xs font-mono bg-muted/50 border border-border rounded text-foreground">
                  {'{{input}}'}
                </code>{' '}
                as a placeholder for data that will be replaced during
                evaluation.
              </p>
            </div>
          </div>
        ) : (
          <InputEditor
            value={inputData}
            onChange={onInputDataChange}
            placeholder="Enter your input data here..."
            model={model}
          />
        )}
      </div>
    </Card>
  );
};

export default UnifiedInputEditor;
