interface ErrorAlertProps {
  error: string;
}

const ErrorAlert = ({ error }: ErrorAlertProps) => {
  if (!error) {
    return null;
  }

  return (
    <div
      role="alert"
      data-testid="error-toast"
      className="relative overflow-hidden rounded-xl bg-red-50/80 backdrop-blur-sm border-2 border-red-200/60 shadow-lg ring-1 ring-red-200/20"
    >
      <div className="absolute inset-0 bg-linear-to-r from-red-500/5 to-pink-500/5"></div>
      <div className="relative flex items-center space-x-4 p-6">
        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shadow-sm">
          <svg
            className="w-6 h-6 text-red-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-red-800">Error</h3>
            <div className="h-1 w-1 bg-red-600 rounded-full"></div>
            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
              Failed
            </span>
          </div>
          <p className="mt-2 text-sm text-red-700 leading-relaxed">{error}</p>
        </div>

        {/* Decorative element */}
        <div className="hidden sm:block">
          <div className="flex space-x-1">
            <div className="w-2 h-8 bg-red-200 rounded-full opacity-60"></div>
            <div className="w-2 h-6 bg-red-300 rounded-full opacity-80"></div>
            <div className="w-2 h-4 bg-red-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
