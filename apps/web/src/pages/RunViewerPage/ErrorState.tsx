import Button from '../../components/ui/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';

interface ErrorStateProps {
  error: string | null;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 transition-colors duration-300 dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="space-y-4 text-center">
        <ErrorMessage message={error || 'Run not found'} />
        <Button onClick={() => (window.location.href = '/')} variant="primary">
          Back to Home
        </Button>
      </div>
    </div>
  );
};
