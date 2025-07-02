const LoadingSpinner = () => {
  return (
    <div
      className="flex items-center justify-center py-8"
      data-testid="loading-spinner"
    >
      <div className="flex space-x-2">
        <div
          className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
