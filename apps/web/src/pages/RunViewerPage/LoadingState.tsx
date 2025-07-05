import { LoadingSpinner } from '../../components/ui/LoadingState.js';

export const LoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-black transition-colors duration-300">
      <LoadingSpinner />
    </div>
  );
};
