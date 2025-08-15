  'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'

// Sample PnL data points
const rawData = [
  { time: '9:30', value: -500 },
  { time: '10:00', value: -300 },
  { time: '10:30', value: -100 },
  { time: '11:00', value: 200 },
  { time: '11:30', value: 500 },
  { time: '12:00', value: 800 },
  { time: '12:30', value: 600 },
  { time: '13:00', value: 300 },
  { time: '13:30', value: -200 },
  { time: '14:00', value: -400 },
  { time: '14:30', value: -100 },
  { time: '15:00', value: 100 },
  { time: '15:30', value: 400 },
  { time: '16:00', value: 700 },
]

// Robust data processing for complex PnL data with multiple zero crossings
const processData = (data: any[]) => {
  const processed = []
  
  for (let i = 0; i < data.length; i++) {
    const current = data[i]
    const next = data[i + 1]
    
    processed.push(current)
    
    if (next) {
      // Handle zero crossing detection more robustly
      const currentValue = current.value || 0
      const nextValue = next.value || 0
      
      // Check for sign change (positive to negative or vice versa)
      const crossesZero = (currentValue > 0 && nextValue < 0) || (currentValue < 0 && nextValue > 0)
      
      // Also handle cases where one value is exactly zero
      const involvesZero = currentValue === 0 || nextValue === 0
      
      if (crossesZero && !involvesZero) {
        // Calculate precise zero crossing point using linear interpolation
        const valueDiff = nextValue - currentValue
        const ratio = Math.abs(currentValue) / Math.abs(valueDiff)
        
        // Handle time interpolation more robustly
        let crossingTime = current.time
        try {
          const currentTimeParts = current.time.split(':')
          const nextTimeParts = next.time.split(':')
          
          if (currentTimeParts.length >= 2 && nextTimeParts.length >= 2) {
            const currentMinutes = parseInt(currentTimeParts[0]) * 60 + parseInt(currentTimeParts[1])
            const nextMinutes = parseInt(nextTimeParts[0]) * 60 + parseInt(nextTimeParts[1])
            
            // Handle day boundary crossings
            let minutesDiff = nextMinutes - currentMinutes
            if (minutesDiff < 0) minutesDiff += 24 * 60 // Handle next day
            
            const crossingMinutes = currentMinutes + (minutesDiff * ratio)
            const crossingHour = Math.floor(crossingMinutes / 60) % 24
            const crossingMinute = Math.floor(crossingMinutes % 60)
            
            crossingTime = `${crossingHour.toString().padStart(2, '0')}:${crossingMinute.toString().padStart(2, '0')}`
          }
        } catch (e) {
          // Fallback to current time if parsing fails
          crossingTime = current.time
        }
        
        // Insert zero crossing point
        processed.push({
          time: crossingTime,
          value: 0,
          isZeroCrossing: true
        })
      }
      
      // Add intermediate points for very volatile data (large value changes)
      const valueDiff = Math.abs(nextValue - currentValue)
      const avgValue = Math.abs((currentValue + nextValue) / 2)
      
      // If the change is very large relative to average, add smoothing points
      if (valueDiff > avgValue * 2 && avgValue > 0) {
        const steps = Math.min(3, Math.floor(valueDiff / avgValue))
        
        for (let step = 1; step <= steps; step++) {
          const ratio = step / (steps + 1)
          const interpolatedValue = currentValue + (nextValue - currentValue) * ratio
          
          // Calculate interpolated time
          let interpolatedTime = current.time
          try {
            const currentTimeParts = current.time.split(':')
            const nextTimeParts = next.time.split(':')
            
            if (currentTimeParts.length >= 2 && nextTimeParts.length >= 2) {
              const currentMinutes = parseInt(currentTimeParts[0]) * 60 + parseInt(currentTimeParts[1])
              const nextMinutes = parseInt(nextTimeParts[0]) * 60 + parseInt(nextTimeParts[1])
              
              let minutesDiff = nextMinutes - currentMinutes
              if (minutesDiff < 0) minutesDiff += 24 * 60
              
              const interpolatedMinutes = currentMinutes + (minutesDiff * ratio)
              const interpolatedHour = Math.floor(interpolatedMinutes / 60) % 24
              const interpolatedMinute = Math.floor(interpolatedMinutes % 60)
              
              interpolatedTime = `${interpolatedHour.toString().padStart(2, '0')}:${interpolatedMinute.toString().padStart(2, '0')}`
            }
          } catch (e) {
            interpolatedTime = current.time
          }
          
          processed.push({
            time: interpolatedTime,
            value: interpolatedValue,
            isInterpolated: true
          })
        }
      }
    }
  }
  
  return processed
}

const chartData = processData(rawData)

// Enhanced Tooltip with data point information
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const value = payload[0].value
    const isPositive = value >= 0
    const isZeroCrossing = data?.isZeroCrossing
    const isInterpolated = data?.isInterpolated
    
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="text-gray-600 dark:text-gray-300 font-medium mb-1">
          {label}
          {isZeroCrossing && <span className="text-blue-500 ml-1">(crossing)</span>}
          {isInterpolated && <span className="text-gray-400 ml-1">(smooth)</span>}
        </div>
        <div className={`font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? '+' : ''}${Math.round(value).toLocaleString()}
        </div>
      </div>
    )
  }
  return null
}

export const CumulativePnlChart = React.memo(function CumulativePnlChart() {
  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white" style={{ height: '385px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cumulative PNL</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
            >
              <span>All time</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-600 shadow-lg min-w-[120px]"
          >
            <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
              All time
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
              Last month
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
              Last week
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 15, left: 0, bottom: 15 }}
          >
            <defs>
              {/* Green gradient for positive areas */}
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              {/* Red gradient for negative areas */}
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              height={25}
              tickMargin={5}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => {
                if (value === 0) return '$0';
                return `$${(value/1000).toFixed(1)}k`;
              }}
              width={55}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: '#6b7280',
                strokeWidth: 1,
                strokeDasharray: '4 4'
              }}
            />
            
            <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={1} />
            
            {/* Positive area - only fills between line and zero when line is above zero */}
            <Area
              type="monotone"
              dataKey={(data) => data.value > 0 ? data.value : 0}
              stroke="none"
              fill="url(#positiveGradient)"
              fillOpacity={1}
              connectNulls={true}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            
            {/* Negative area - only fills between line and zero when line is below zero */}
            <Area
              type="monotone"
              dataKey={(data) => data.value < 0 ? data.value : 0}
              stroke="none"
              fill="url(#negativeGradient)"
              fillOpacity={1}
              connectNulls={true}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            
            {/* Main line stroke */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3559E9"
              strokeWidth={2.5}
              fill="none"
              connectNulls={true}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#3559E9",
                stroke: "#fff",
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})