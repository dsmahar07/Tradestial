'use client'

import { motion } from 'framer-motion'
import React, { useEffect, useState, useMemo } from 'react'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { Info } from 'lucide-react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { Button } from '@/components/ui/button'

interface ProgressData {
  date: Date
  score: number
  completed: number
  total: number
}

interface ActivityJournalHeatmapProps {
  todayScore?: number
  todayCompleted?: number
  todayTotal?: number
  history?: Record<string, { completed: number; total: number; score: number }>
  onOpenDailyChecklist?: () => void
  // Optional explicit height for the widget (outer card). Defaults to 432px to preserve existing layouts.
  height?: number
}

const toKey = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfWeekSun = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay() // 0 = Sun
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

const getIntensity = (score: number): string => {
  if (score === 0) return 'bg-gray-100 dark:bg-gray-700'
  if (score <= 20) return 'bg-blue-200 dark:bg-blue-900'
  if (score <= 40) return 'bg-blue-300 dark:bg-blue-800'
  if (score <= 60) return 'bg-blue-400 dark:bg-blue-700'
  if (score <= 80) return 'bg-blue-500 dark:bg-blue-600'
  return 'bg-blue-600 dark:bg-blue-500'
}

export function ActivityJournalHeatmap({ 
  todayScore = 0, 
  todayCompleted = 0, 
  todayTotal = 0,
  history = {},
  onOpenDailyChecklist,
  height = 432,
}: ActivityJournalHeatmapProps = {}) {
  const gridAreaRef = React.createRef<HTMLDivElement>()
  const firstRowCellsRef = React.createRef<HTMLDivElement>()
  const [cellSize, setCellSize] = React.useState<number>(16)

  React.useEffect(() => {
    const computeSize = () => {
      setCellSize(16) 
    }
    computeSize()
  }, [])
  
  const todayData = React.useMemo(() => {
    return {
      date: new Date(),
      score: todayScore,
      completed: todayCompleted,
      total: todayTotal
    }
  }, [todayScore, todayCompleted, todayTotal])

  const historyWithToday = React.useMemo(() => {
    const merged = { ...history }
    const k = toKey(todayData.date)
    merged[k] = {
      completed: todayData.completed,
      total: todayData.total,
      score: todayData.total > 0 ? Math.round((todayData.completed / todayData.total) * 100) : 0,
    }
    return merged
  }, [history, todayData])

  const weeks = React.useMemo(() => {
    const today = new Date()
    const startThisWeek = startOfWeekSun(today)
    
    // Get all possible weeks first
    const allWeeks: Date[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(startThisWeek)
      d.setDate(d.getDate() - i * 7)
      allWeeks.push(d)
    }
    
    // Filter weeks that have at least one day with data
    const weeksWithData = allWeeks.filter(startOfWeek => {
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellDate = new Date(startOfWeek)
        cellDate.setDate(cellDate.getDate() + dayIndex)
        const key = toKey(cellDate)
        const entry = historyWithToday[key]
        if (entry && entry.total > 0) {
          return true
        }
      }
      return false
    })
    
    return weeksWithData
  }, [historyWithToday])

  const monthHeaders = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthRanges: { month: string; startWeek: number; weekCount: number }[] = []
    
    // Group consecutive weeks by month
    let currentMonth = ''
    let currentStart = 0
    let currentCount = 0
    
    weeks.forEach((startOfWeek, weekIndex) => {
      const month = months[startOfWeek.getMonth()]
      
      if (month !== currentMonth) {
        // Save previous month if it had weeks
        if (currentMonth && currentCount > 0) {
          monthRanges.push({ 
            month: currentMonth, 
            startWeek: currentStart, 
            weekCount: currentCount 
          })
        }
        
        // Start new month
        currentMonth = month
        currentStart = weekIndex
        currentCount = 1
      } else {
        currentCount++
      }
    })
    
    // Add the last month
    if (currentMonth && currentCount > 0) {
      monthRanges.push({ 
        month: currentMonth, 
        startWeek: currentStart, 
        weekCount: currentCount 
      })
    }
    
    // Only show months with significant presence (at least 2 weeks)
    return monthRanges.filter(({ weekCount }) => weekCount >= 2)
  }, [weeks])

  // Compute heights based on provided height. Historically outer=432 and inner content area=340 (difference 92).
  const OUTER_INNER_OFFSET = 92
  const outerHeight = Math.max(0, height)
  const innerContentHeight = Math.max(0, height - OUTER_INNER_OFFSET)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: `${outerHeight}px` }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Journal</h3>
            <RadixTooltip.Provider>
              <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Info size={16} />
                  </button>
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                  <RadixTooltip.Content
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm max-w-xs z-50"
                    sideOffset={5}
                  >
                    Trading activity heatmap showing your daily trading frequency and performance over the year. Darker squares indicate higher trading activity, with color intensity representing profit/loss levels. Helps identify patterns in your trading schedule and performance consistency.
                    <RadixTooltip.Arrow className="fill-white dark:fill-gray-800" />
                  </RadixTooltip.Content>
                </RadixTooltip.Portal>
              </RadixTooltip.Root>
            </RadixTooltip.Provider>
          </div>
          
          {/* Legend moved to header */}
          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700"></div>
              <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900/60"></div>
              <div className="w-3 h-3 bg-blue-300 dark:bg-blue-800/70"></div>
              <div className="w-3 h-3 bg-blue-400 dark:bg-blue-700/80"></div>
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-600/90"></div>
              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500"></div>
            </div>
            <span>More</span>
          </div>
        </div>
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
        
        {/* Fixed Height Content Area */}
        <div className="flex flex-col px-1 overflow-visible" style={{ height: `${innerContentHeight}px` }}>
          {/* Month Headers - Dynamic Layout */}
          <div className="flex mb-3">
            <div className="w-10"></div> {/* Space for day labels */}
            <div className={`flex-1 grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
              {monthHeaders.map(({ month, startWeek, weekCount }) => (
                <div
                  key={month}
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center bg-gray-50 dark:bg-gray-800 rounded px-1 py-0.5"
                  style={{
                    gridColumn: `${startWeek + 1} / ${startWeek + weekCount + 1}`
                  }}
                >
                  {month}
                </div>
              ))}
            </div>
          </div>
          
          {/* Weekly Calendar Grid - Optimized */}
          <div ref={gridAreaRef} className="mb-4 flex-1">
            <div className="grid grid-cols-[40px_1fr] gap-2">
              {/* Day Labels */}
              <div className="space-y-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                  <div key={dayName} className="h-7 flex items-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {dayName}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
                {weeks.map((startOfWeek, weekIndex) => (
                  <div key={weekIndex} className="space-y-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                      const cellDate = new Date(startOfWeek)
                      cellDate.setDate(cellDate.getDate() + dayIndex)
                      const key = toKey(cellDate)
                      const entry = historyWithToday[key]
                      const score = entry?.score ?? 0
                      const title = `${cellDate.toDateString()} — ${entry ? `${entry.completed}/${entry.total} (${score}%)` : 'No data'}`
                      
                      // Only show cells with data
                      if (!entry || entry.total === 0) {
                        return null
                      }
                      
                      const intensity = getIntensity(score)

                      return (
                        <div
                          key={dayIndex}
                          className={`w-7 h-7 ${intensity} transition-colors hover:ring-1 hover:ring-blue-300`}
                          title={title}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          

          <div className="flex-1"></div>
          
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] mb-4" />
          
          {/* Bottom Section */}
          <div className="flex items-center justify-between">
            {/* Today's Score */}
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Today's score</span>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className="flex items-center gap-4">
                {/* Performance Radar style progress bar */}
                <div className="flex-1 max-w-md relative">
                  {/* Track */}
                  <div className="relative h-2 rounded-full bg-gray-200 dark:bg-neutral-800">
                    {/* Dynamic gradient fill up to score */}
                    <div
                      className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] transition-all duration-300"
                      style={{ width: `${Math.min(99, Math.max(1, todayData.total > 0 ? (todayData.completed / todayData.total) * 100 : 0))}%` }}
                    />
                    {/* Checkpoint dividers */}
                    {[20, 40, 60, 80].map(checkpoint => (
                      <div
                        key={checkpoint}
                        className="absolute top-0 h-2 w-px bg-white dark:bg-gray-700 z-20"
                        style={{ left: `calc(${checkpoint}% - 0.5px)` }}
                      />
                    ))}
                    {/* Marker */}
                    <span
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 block h-3 w-3 rounded-full border-2 bg-white"
                      style={{ 
                        left: `${Math.min(99, Math.max(1, todayData.total > 0 ? (todayData.completed / todayData.total) * 100 : 0))}%`, 
                        borderColor: '#693EE0' 
                      }}
                    />
                  </div>
                  {/* Ticks */}
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                    <span>60</span>
                    <span>80</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Daily Checklist Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDailyChecklist}
              className="bg-white dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 border-gray-300 dark:border-[#2a2a2a] hover:text-gray-900 dark:hover:text-white text-sm"
            >
              Daily checklist
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}