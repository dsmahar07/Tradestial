'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { useState } from 'react'
import { useTheme } from '@/hooks/use-theme'

interface PerformanceData {
  metric: string
  current: number
  benchmark: number
  fullScore: number
}

// Sample trader performance data (0-100 scale)
const performanceData: PerformanceData[] = [
  {
    metric: 'Risk Management',
    current: 78,
    benchmark: 70,
    fullScore: 100
  },
  {
    metric: 'Consistency',
    current: 65,
    benchmark: 60,
    fullScore: 100
  },
  {
    metric: 'Profitability',
    current: 82,
    benchmark: 65,
    fullScore: 100
  },
  {
    metric: 'Win Rate',
    current: 57,
    benchmark: 55,
    fullScore: 100
  },
  {
    metric: 'Risk-Reward',
    current: 73,
    benchmark: 60,
    fullScore: 100
  },
  {
    metric: 'Discipline',
    current: 68,
    benchmark: 65,
    fullScore: 100
  }
]

const timeRanges = ['Last 7 Days', 'Last Month', 'Last 3 Months', 'YTD', 'All Time']

export const TraderPerformanceRadar = React.memo(function TraderPerformanceRadar() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last Month')
  const { theme } = useTheme()
  
  // Derive dark mode from theme context
  const isDarkMode = theme === 'dark' || (theme === 'system' && 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#335CFF' }}
            />
            <span className="text-gray-600 dark:text-gray-300">
              Your Score: {payload[0].value}/100
            </span>
          </div>
        </div>
      )
    }
    return null
  }



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Analysis
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedTimeRange}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-40 bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-600 shadow-lg"
              >
                {timeRanges.map((range) => (
                  <DropdownMenuItem
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer ${
                      selectedTimeRange === range ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                  >
                    {range}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>



        {/* Radar Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={performanceData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid 
                stroke={isDarkMode ? '#4b5563' : '#e5e7eb'}
                gridType="polygon"
              />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ 
                  fontSize: 12, 
                  fill: isDarkMode ? '#d1d5db' : '#6b7280',
                  fontWeight: 500
                }}
                tickFormatter={(value) => value}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                tickCount={6}
              />
              
              {/* Current performance radar */}
              <Radar
                name="Your Performance"
                dataKey="current"
                stroke="#335CFF"
                fill="#335CFF"
                fillOpacity={0.15}
                strokeWidth={3}
                dot={{ 
                  fill: '#335CFF', 
                  strokeWidth: 3, 
                  r: 5,
                  stroke: isDarkMode ? '#171717' : '#ffffff',
                  fillOpacity: 1
                }}
              />
              
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>


      </div>
    </motion.div>
  )
})