'use client'

import { cn } from '@/lib/utils'

interface StialScaleProps {
  current: number
  max: number
  color: 'red' | 'yellow' | 'green'
  className?: string
}

export function StialScale({ current, max, color, className }: StialScaleProps) {
  const percentage = Math.min((current / max) * 100, 100)
  // Prevent visual clipping at the edges while keeping value accurate
  const markerPos = Math.min(99, Math.max(1, percentage))

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Left: label + value */}
        <div className="min-w-[140px] overflow-hidden">
          <div className="text-xs text-gray-600 dark:text-gray-400">Avg Stial Scale</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">{current.toFixed(1)}</div>
        </div>

        {/* Vertical separator */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

        {/* Right: gradient progress with marker and ticks */}
        <div className="relative flex-1">
          {/* Track */}
          <div className="relative h-2 rounded-full bg-gray-200 dark:bg-neutral-800">
            {/* Dynamic gradient fill up to score */}
            <div
              className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E]"
              style={{ width: `${markerPos}%` }}
            />
            {/* Checkpoint dividers - always on top, aligned to text below */}
            {[20, 40, 60, 80].map(checkpoint => (
              <div
                key={checkpoint}
                className="absolute top-0 h-2 w-px bg-white dark:bg-gray-700 z-20"
                style={{ left: `calc(${checkpoint}% - 0.5px)` }}
              />
            ))}
            {/* Marker */}
            <span
              aria-label="stial-scale-marker"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 block h-3 w-3 rounded-full border-2 bg-white"
              style={{ left: `${markerPos}%`, borderColor: '#693EE0' }}
            />
          </div>
          {/* ticks */}
          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>{max}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
