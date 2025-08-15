interface ProgressWidgetProps {
  completed: number
  total: number
  title?: string
  emptyMessage?: string
  className?: string
}

export function ProgressWidget({ 
  completed = 0, 
  total = 0, 
  title = "Progress",
  emptyMessage = "No active rules today",
  className = ""
}: ProgressWidgetProps) {
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className={`bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-gray-500" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="2" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {completed}/{total}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {total === 0 && (
        <div className="text-center py-8">
          <div className="w-20 h-24 mx-auto mb-4 relative">
            {/* Clipboard icon */}
            <svg className="w-full h-full text-purple-600" viewBox="0 0 120 144" fill="none">
              <rect x="20" y="20" width="80" height="104" rx="4" fill="currentColor" opacity="0.2"/>
              <rect x="16" y="16" width="88" height="112" rx="4" fill="currentColor" opacity="0.1"/>
              <rect x="24" y="24" width="72" height="96" rx="2" fill="white" stroke="currentColor" strokeWidth="2"/>
              <rect x="40" y="8" width="40" height="20" rx="4" fill="currentColor"/>
              <rect x="32" y="40" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="48" y1="44" x2="80" y2="44" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="32" y="56" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="48" y1="60" x2="72" y2="60" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="32" y="72" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="48" y1="76" x2="80" y2="76" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="32" y="88" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="48" y1="92" x2="72" y2="92" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{emptyMessage}</h4>
        </div>
      )}
    </div>
  )
}