import { themeColors } from '@/config/theme'

interface CalendarWidgetProps {
  title?: string
  emptyMessage?: string
  hasEvents?: boolean
  events?: Array<{
    id: string
    title: string
    date: string
    time?: string
  }>
  className?: string
  onEventClick?: (eventId: string) => void
}

export function CalendarWidget({ 
  title = "Calendar",
  emptyMessage = "No economic events available for current filters.",
  hasEvents = false,
  events = [],
  className = "",
  onEventClick
}: CalendarWidgetProps) {
  return (
    <div className={`bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {hasEvents && events.length > 0 ? (
        <div className="space-y-3">
          {events.map(event => (
            <div 
              key={event.id} 
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => onEventClick?.(event.id)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{event.title}</h4>
                {event.time && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{event.time}</span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{event.date}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <rect x="7" y="14" width="2" height="2"/>
              <rect x="15" y="14" width="2" height="2"/>
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}