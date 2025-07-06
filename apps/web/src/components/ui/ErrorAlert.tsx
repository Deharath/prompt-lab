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
      className="relative overflow-hidden rounded-xl border-2 border-red-200/60 bg-red-50/80 shadow-lg ring-1 ring-red-200/20 backdrop-blur-sm"
    >
      <div className="absolute inset-0 bg-linear-to-r from-red-500/5 to-pink-500/5" />
      <div className="relative flex items-center space-x-4 p-6">
        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shadow-sm">
          <svg
            className="h-6 w-6 text-red-600"
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
            <div className="h-1 w-1 rounded-full bg-red-600" />
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-600">
              Failed
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-red-700">{error}</p>
        </div>

        {/* Decorative element */}
        <div className="hidden sm:block">
          <div className="flex space-x-1">
            <div className="h-8 w-2 rounded-full bg-red-200 opacity-60" />
            <div className="h-6 w-2 rounded-full bg-red-300 opacity-80" />
            <div className="h-4 w-2 rounded-full bg-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
