'use client'

import { cn } from '@/lib/utils'

interface ZellaScaleProps {
  current: number
  max: number
  color: 'red' | 'yellow' | 'green'
  className?: string
}

export function ZellaScale({ current, max, color, className }: ZellaScaleProps) {
  const percentage = Math.min((current / max) * 100, 100)
  
  const getColorClasses = () => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-red-500',
          track: 'bg-red-100 dark:bg-red-900/30'
        }
      case 'yellow':
        return {
          bg: 'bg-yellow-500',
          track: 'bg-yellow-100 dark:bg-yellow-900/30'
        }
      case 'green':
        return {
          bg: 'bg-green-500',
          track: 'bg-green-100 dark:bg-green-900/30'
        }
      default:
        return {
          bg: 'bg-gray-500',
          track: 'bg-gray-100 dark:bg-gray-900/30'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Avg Zella Scale
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative">
        {/* Track */}
        <div className={cn("h-2 rounded-full", colors.track)}>
          {/* Progress */}
          <div
            className={cn("h-2 rounded-full transition-all duration-300", colors.bg)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Color segments indicator (optional visual enhancement) */}
        <div className="absolute inset-0 flex rounded-full overflow-hidden">
          <div className="flex-1 bg-red-200 dark:bg-red-800/20" />
          <div className="flex-1 bg-yellow-200 dark:bg-yellow-800/20" />
          <div className="flex-1 bg-green-200 dark:bg-green-800/20" />
        </div>
        
        {/* Current position indicator */}
        <div
          className="absolute top-0 h-2 w-1 bg-gray-800 dark:bg-gray-200 rounded-full transform -translate-x-0.5"
          style={{ left: `${percentage}%` }}
        />
      </div>
      
      {/* Scale labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>0</span>
        <span>{max}</span>
      </div>
      
      {/* Current value */}
      <div className="text-center">
        <span className={cn(
          "text-lg font-semibold",
          color === 'red' && "text-red-600 dark:text-red-400",
          color === 'yellow' && "text-yellow-600 dark:text-yellow-400", 
          color === 'green' && "text-green-600 dark:text-green-400"
        )}>
          {current.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
          / {max}
        </span>
      </div>
    </div>
  )
}