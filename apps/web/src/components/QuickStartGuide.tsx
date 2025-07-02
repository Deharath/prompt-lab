import { useState } from 'react';

interface QuickStartGuideProps {
  onClose: () => void;
  onExampleLoad: (template: string) => void;
}

const QuickStartGuide = ({ onClose, onExampleLoad }: QuickStartGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const examples = [
    {
      title: 'Text Summarization',
      description: 'Summarize long text content into key points',
      template: `Please summarize the following text into 3-5 key bullet points:

{{input}}

Focus on the most important information and main themes.`,
    },
    {
      title: 'Sentiment Analysis',
      description: 'Analyze the emotional tone of text',
      template: `Analyze the sentiment of this text and categorize it as positive, negative, or neutral. Provide a brief explanation:

{{input}}

Sentiment: [positive/negative/neutral]
Explanation:`,
    },
    {
      title: 'Creative Writing',
      description: 'Generate creative content based on prompts',
      template: `Write a creative short story (100-200 words) based on this prompt:

{{input}}

Make it engaging and include vivid descriptions.`,
    },
    {
      title: 'Code Review',
      description: 'Review and analyze code snippets',
      template: `Review the following code and provide feedback on:
1. Code quality and readability
2. Potential improvements
3. Best practices

{{input}}

Please be constructive and specific in your feedback.`,
    },
  ];

  const steps = [
    {
      title: 'Welcome to Prompt Lab!',
      content:
        "Let's get you started with evaluating and testing AI prompts. This tool helps you create, test, and compare different prompt templates.",
      action: 'Get Started',
    },
    {
      title: 'Choose a Template',
      content:
        'Start with one of our example templates or create your own. Templates use {{input}} as placeholders for variable content.',
      action: 'See Examples',
    },
    {
      title: 'Select AI Provider',
      content:
        'Choose between different AI providers (OpenAI, Gemini) and models. Each has different capabilities and strengths.',
      action: 'Got It',
    },
    {
      title: 'Run & Analyze',
      content:
        "Click 'Run Evaluation' to test your prompt. Watch the live output stream and review the evaluation metrics.",
      action: 'Start Testing',
    },
  ];

  const handleExampleSelect = (template: string) => {
    onExampleLoad(template);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
    >
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative max-w-2xl w-full mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 via-purple-600 to-blue-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm"
                aria-hidden="true"
              >
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 id="guide-title" className="text-2xl font-bold text-white">
                Quick Start Guide
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close quick start guide"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {currentStep < steps.length ? (
            // Step Content
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                  {currentStep + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {steps[currentStep].title}
                  </h3>
                  <div
                    className="mt-2 flex space-x-1"
                    role="progressbar"
                    aria-valuenow={currentStep + 1}
                    aria-valuemin={1}
                    aria-valuemax={steps.length}
                    aria-label={`Step ${currentStep + 1} of ${steps.length}`}
                  >
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index <= currentStep
                            ? 'bg-blue-500 w-8'
                            : 'bg-gray-200 w-4'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-lg leading-relaxed">
                {steps[currentStep].content}
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  aria-label={`Continue to ${currentStep + 2 < steps.length ? steps[currentStep + 1].title : 'examples'}`}
                  className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                >
                  {steps[currentStep].action}
                </button>
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    aria-label={`Go back to ${steps[currentStep - 1].title}`}
                    className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:text-gray-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Examples Content
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  Choose an Example Template
                </h3>
                <p className="text-gray-600 mt-2">
                  Select a template to get started quickly, or close this guide
                  to create your own.
                </p>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                role="group"
                aria-label="Template examples"
              >
                {examples.map((example, index) => (
                  <button
                    key={example.title}
                    onClick={() => handleExampleSelect(example.template)}
                    aria-label={`Select ${example.title} template: ${example.description}`}
                    className="group p-6 text-left border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600 text-white text-sm font-bold"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {example.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {example.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    localStorage.setItem('prompt-lab-used', 'true');
                    onClose();
                  }}
                  aria-label="Skip examples and create your own template"
                  className="flex-1 bg-linear-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50"
                >
                  Create My Own
                </button>
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  aria-label="Go back to previous step"
                  className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:text-gray-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickStartGuide;
