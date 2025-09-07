'use client'

import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetricCategory } from '@/types/performance'

interface MetricSelectorProps {
  selectedMetric: string
  allMetrics: string[]
  availableMetrics: MetricCategory
  onMetricSelect: (metric: string) => void
  onRemove?: () => void
  className?: string
  placeholder?: string
  color?: string
  isRemovable?: boolean
  'aria-label'?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

const MetricSelectorComponent = ({
  selectedMetric,
  allMetrics,
  availableMetrics,
  onMetricSelect,
  onRemove,
  className,
  placeholder = "Select metric",
  color,
  isRemovable = false,
  'aria-label': ariaLabel
}: MetricSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Time Analysis'])
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 200)

  // Get display name for metric (truncated)
  const getDisplayMetricName = useCallback((metric: string): string => {
    if (metric.length <= 25) return metric
    
    if (metric.includes(' - cumulative')) {
      const baseName = metric.replace(' - cumulative', '')
      if (baseName.length <= 20) return baseName + '...'
      return baseName.substring(0, 20) + '...'
    }
    
    return metric.substring(0, 25) + '...'
  }, [])

  // Filter categories based on search
  const filteredCategories = React.useMemo(() => {
    if (debouncedSearchQuery.trim() === '') {
      return availableMetrics
    }
    
    return Object.entries(availableMetrics).reduce((acc, [category, metrics]) => {
      const filteredMetrics = metrics.filter(metric => 
        metric.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        category.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      if (filteredMetrics.length > 0) {
        acc[category] = filteredMetrics
      }
      return acc
    }, {} as MetricCategory)
  }, [availableMetrics, debouncedSearchQuery])

  // Get flattened list of options for keyboard navigation
  const flatOptions = React.useMemo(() => {
    const options: { type: 'category' | 'metric', value: string, category?: string }[] = []
    
    Object.entries(filteredCategories).forEach(([category, metrics]) => {
      options.push({ type: 'category', value: category })
      if (expandedCategories.includes(category)) {
        metrics.forEach(metric => {
          options.push({ type: 'metric', value: metric, category })
        })
      }
    })
    
    return options
  }, [filteredCategories, expandedCategories])

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }, [])

  // Handle metric selection
  const handleMetricSelect = useCallback((metric: string) => {
    if (!allMetrics.includes(metric)) {
      onMetricSelect(metric)
      setIsOpen(false)
      setSearchQuery('')
      setFocusedIndex(-1)
      
      // Return focus to button
      setTimeout(() => buttonRef.current?.focus(), 0)
    }
  }, [allMetrics, onMetricSelect])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        setFocusedIndex(-1)
        buttonRef.current?.focus()
        break
        
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, flatOptions.length - 1))
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, -1))
        break
        
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0) {
          const option = flatOptions[focusedIndex]
          if (option.type === 'category') {
            toggleCategory(option.value)
          } else if (option.type === 'metric') {
            handleMetricSelect(option.value)
          }
        }
        break
    }
  }, [isOpen, focusedIndex, flatOptions, toggleCategory, handleMetricSelect])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className={cn("relative flex items-center", className)} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[120px] max-w-[180px] lg:max-w-[220px] justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: color
        }}
        title={selectedMetric}
        aria-label={ariaLabel || `Change metric: ${selectedMetric}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
      >
        <span className="truncate text-left">{getDisplayMetricName(selectedMetric)}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 flex-shrink-0", isOpen && "rotate-180")} />
      </button>
      
      {/* Remove button for additional metrics */}
      {isRemovable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-gray-400 hover:text-red-500 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Remove metric"
          aria-label={`Remove ${selectedMetric} metric`}
        >
          ×
        </button>
      )}
      
      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-[280px] sm:w-[320px] max-h-[450px] overflow-hidden z-50"
          role="listbox"
          aria-label="Available metrics"
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search metrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-3 py-2.5 text-sm border-0 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 transition-colors duration-200"
                autoComplete="off"
                role="searchbox"
                aria-label="Search metrics"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="overflow-y-auto max-h-[360px]">
            {Object.entries(filteredCategories).map(([category, metrics], categoryIndex) => (
              <div key={category} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                <button
                  onClick={() => toggleCategory(category)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700",
                    focusedIndex === flatOptions.findIndex(opt => opt.type === 'category' && opt.value === category) && "bg-gray-100 dark:bg-gray-700"
                  )}
                  aria-expanded={expandedCategories.includes(category)}
                  role="button"
                >
                  <span>{category}</span>
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 transition-transform duration-200 text-gray-400",
                      expandedCategories.includes(category) ? "rotate-180" : ""
                    )}
                    aria-hidden="true"
                  />
                </button>
                {expandedCategories.includes(category) && (
                  <div className="pb-2">
                    {metrics.map((metric) => {
                      const isAlreadySelected = allMetrics.includes(metric)
                      const optionIndex = flatOptions.findIndex(opt => opt.type === 'metric' && opt.value === metric)
                      
                      return (
                        <button
                          key={metric}
                          onClick={() => !isAlreadySelected && handleMetricSelect(metric)}
                          onKeyDown={handleKeyDown}
                          disabled={isAlreadySelected}
                          className={cn(
                            "w-full text-left px-6 py-2 text-sm transition-all duration-150 focus:outline-none",
                            isAlreadySelected
                              ? "text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                              : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400",
                            focusedIndex === optionIndex && !isAlreadySelected && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          )}
                          aria-label={`Select ${metric}${isAlreadySelected ? ' (already selected)' : ''}`}
                          role="option"
                          aria-selected={selectedMetric === metric}
                        >
                          {metric} {isAlreadySelected && "✓"}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* No Results */}
            {Object.keys(filteredCategories).length === 0 && debouncedSearchQuery && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                <div className="text-gray-400 mb-2">No metrics found</div>
                <div className="text-xs">Try a different search term</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const ChartMetricSelector = memo(MetricSelectorComponent)
