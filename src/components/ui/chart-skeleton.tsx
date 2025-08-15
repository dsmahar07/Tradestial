export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  )
}