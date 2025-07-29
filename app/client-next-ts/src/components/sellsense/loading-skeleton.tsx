// Enhanced skeleton loading component that matches dashboard structure
export function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-sellsense-background-light min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6 md:mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>

      {/* Stats Grid skeleton - matches dashboard overview structure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white shadow-md rounded-xl p-4 md:p-6 flex items-center gap-3 md:gap-5"
          >
            <div className="bg-gray-200 rounded-lg p-2 md:p-3 w-12 h-12 md:w-14 md:h-14"></div>
            <div className="flex-1">
              <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="space-y-6">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>

        {/* Cards grid - matches wallet overview structure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((column) => (
            <div key={column} className="space-y-4">
              {/* Component card skeleton - removed border for cleaner look */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-32 bg-gray-200 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  </div>
                </div>

                {/* Component content skeleton */}
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>

                {/* Action buttons skeleton */}
                <div className="flex gap-2 mt-4">
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional content skeleton - removed border for cleaner look */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
            <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
