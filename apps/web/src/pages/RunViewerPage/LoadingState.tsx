import { LoadingSpinner } from '../../components/ui/LoadingState.js';

export const LoadingState = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 transition-colors duration-300 dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <LoadingSpinner />
    </div>
  );
};
