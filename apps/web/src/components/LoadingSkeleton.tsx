const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Skeleton */}
      <div className="relative bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-8">
            {/* Configuration Panel Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-gray-200/50">
              <div className="p-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="space-y-3">
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-32 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                    <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Panel Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-gray-200/50">
              <div className="p-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse"></div>
                  <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-64 w-full bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-gray-200/50">
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
