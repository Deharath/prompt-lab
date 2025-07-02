import Card from './ui/Card.js';
import Button from './ui/Button.js';

interface WelcomeCardProps {
  onGetStarted: () => void;
}

const WelcomeCard = ({ onGetStarted }: WelcomeCardProps) => {
  return (
    <Card title="Welcome to Prompt Lab" className="animate-scale-in">
      <div className="p-12 text-center space-y-8">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 text-white shadow-lg animate-float">
          <svg
            className="h-10 w-10"
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
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold bg-linear-to-r bg-clip-text text-transparent transition-colors duration-300 from-gray-900 via-blue-800 to-purple-800 dark:from-gray-100 dark:via-blue-300 dark:to-purple-300">
            Welcome to Prompt Lab
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed transition-colors duration-300 text-gray-600 dark:text-gray-300">
            Create, test, and evaluate AI prompts with real-time streaming and
            comprehensive metrics. Get started by writing your first prompt
            template or explore our examples.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <svg
                className="h-6 w-6"
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
            <h3 className="font-semibold transition-colors duration-300 text-gray-900 dark:text-gray-100">
              Smart Templates
            </h3>
            <p className="text-sm transition-colors duration-300 text-gray-600 dark:text-gray-400">
              Use {`{{input}}`} placeholders for dynamic content replacement
            </p>
          </div>

          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
              <svg
                className="h-6 w-6"
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
            <h3 className="font-semibold transition-colors duration-300 text-gray-900 dark:text-gray-100">
              Live Streaming
            </h3>
            <p className="text-sm transition-colors duration-300 text-gray-600 dark:text-gray-400">
              Watch AI responses stream in real-time during evaluation
            </p>
          </div>

          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold transition-colors duration-300 text-gray-900 dark:text-gray-100">
              Rich Metrics
            </h3>
            <p className="text-sm transition-colors duration-300 text-gray-600 dark:text-gray-400">
              Comprehensive evaluation with detailed performance metrics
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-8">
          <Button
            onClick={onGetStarted}
            variant="primary"
            size="lg"
            className="group"
            icon={
              <svg
                className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            }
          >
            Get Started!
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeCard;
