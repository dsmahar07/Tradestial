'use client'

import React, { useState, useRef, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'
import { ChartType } from '@/types/performance'

interface ChartCustomizationPanelProps {
  allMetrics: string[]
  chartTypes: Record<string, ChartType>
  chartColors: Record<string, string>
  availableColors: string[]
  onChartTypeChange: (metric: string, type: ChartType) => void
  onColorChange: (metric: string, color: string) => void
  onResetToDefault: () => void
  getChartType: (metric: string) => ChartType
  getChartColor: (metric: string, index: number) => string
  getDisplayMetricName: (metric: string) => string
}

const ChartCustomizationPanelComponent = ({
  allMetrics,
  chartTypes,
  chartColors,
  availableColors,
  onChartTypeChange,
  onColorChange,
  onResetToDefault,
  getChartType,
  getChartColor,
  getDisplayMetricName
}: ChartCustomizationPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Chart customization options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 9H9V21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V11C3 10.4696 3.21071 9.96086 3.58579 9.58579C3.96086 9.21071 4.46957 9 5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5V21H9V5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 7H19C19.5304 7 20.0391 7.21071 20.4142 7.58579C20.7893 7.96086 21 8.46957 21 9V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Customization Dropdown */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-[280px] max-h-[400px] overflow-y-auto z-50"
          role="dialog"
          aria-label="Chart customization options"
          onKeyDown={handleKeyDown}
        >
          <div className="p-4 space-y-4">
            {allMetrics.map((metric, index) => (
              <div key={metric} className="space-y-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {getDisplayMetricName(metric)}
                </div>
                
                {/* Color Picker */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-gray-300 dark:border-[#2a2a2a] flex-shrink-0" 
                    style={{ backgroundColor: getChartColor(metric, index) }}
                    aria-label={`Current color for ${metric}`}
                    role="img"
                  />
                  <div className="flex gap-1 flex-wrap" role="radiogroup" aria-label={`Color options for ${metric}`}>
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => onColorChange(metric, color)}
                        className={cn(
                          "w-5 h-5 rounded border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500",
                          getChartColor(metric, index) === color 
                            ? "border-gray-400 scale-110" 
                            : "border-transparent hover:border-gray-300"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Set color to ${color} for ${metric}`}
                        role="radio"
                        aria-checked={getChartColor(metric, index) === color}
                      />
                    ))}
                  </div>
                </div>

                {/* Chart Type Selector */}
                <div className="relative">
                  <label htmlFor={`chart-type-${index}`} className="sr-only">
                    Chart type for {metric}
                  </label>
                  <select
                    id={`chart-type-${index}`}
                    value={getChartType(metric)}
                    onChange={(e) => onChartTypeChange(metric, e.target.value as ChartType)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Area">Area</option>
                    <option value="Line">Line</option>
                    <option value="Column">Column</option>
                  </select>
                </div>
              </div>
            ))}

            {/* Reset Button */}
            <div className="pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
              <button
                onClick={() => {
                  onResetToDefault()
                  setIsOpen(false)
                }}
                className="text-sm text-blue-500 hover:text-blue-600 transition-colors focus:outline-none focus:underline"
              >
                Reset to default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const ChartCustomizationPanel = memo(ChartCustomizationPanelComponent)
