  'use client'

import React, { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'
import { useChartData } from '@/hooks/use-analytics'

// chartData will be generated dynamically in the component

// Simple Tooltip showing only P&L amount
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    console.log('🔍 Tooltip payload:', payload[0])
    const value = payload[0].value || payload[0].payload?.value
    console.log('🔍 Tooltip value:', value)
    
    if (value === undefined || value === null) {
      return (
        <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
          <div className="font-semibold text-gray-500">
            No data
          </div>
        </div>
      )
    }
    
    const formattedValue = value >= 0 ? `$${value.toLocaleString()}` : `-$${Math.abs(value).toLocaleString()}`
    
    return (
      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className={`font-semibold ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formattedValue}
        </div>
      </div>
    )
  }
  return null
}

export const CumulativePnlChart = React.memo(function CumulativePnlChart() {
  // Pull reactive, filtered, cached chart data from analytics service
  const { data: rawData, loading } = useChartData('cumulativePnL')

  // Map reactive data shape to chart's expected shape
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    // Ensure chronological order
    const sorted = [...rawData].sort((a: { date: string }, b: { date: string }) => {
      const ta = new Date(a.date).getTime()
      const tb = new Date(b.date).getTime()
      return ta - tb
    })

    // Map to display-friendly labels
    const mapped = sorted.map((d: { date: string; cumulative: number }, index: number) => {
      const dt = new Date(d.date)
      let label: string
      if (isNaN(dt.getTime())) {
        // Fallback if date parsing fails
        label = d.date
      } else {
        // Format as "MM/dd" (e.g., "01/15")
        const month = String(dt.getMonth() + 1).padStart(2, '0')
        const day = String(dt.getDate()).padStart(2, '0')
        label = `${month}/${day}`
      }
      return {
        time: label,
        value: Math.round(d.cumulative || 0),
        index
      }
    })

    // Prepend a synthetic baseline point at $0 one day before the first data point
    // Hide its tick label by setting an empty label so it doesn't appear on X-axis.
    if (sorted.length > 0) {
      const firstDateStr = sorted[0].date
      const firstDate = new Date(firstDateStr)
      if (!isNaN(firstDate.getTime())) {
        firstDate.setDate(firstDate.getDate() - 1)
        return [{ time: '', value: 0, index: -1 }, ...mapped]
      }
    }
    return mapped
  }, [rawData])

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 h-[385px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-center">
          <div>Loading cumulative P&L…</div>
        </div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 h-[385px] text-gray-900 dark:text-white">
        {/* Header (title visible, dropdown hidden) */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cumulative PNL</h3>
        </div>
        {/* Empty state */}
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-center">
            <div>No trade data available</div>
            <div className="text-sm mt-1">Import your CSV to see cumulative P&L</div>
          </div>
        </div>
      </div>
    )
  }

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
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
            >
              <span>All time</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] shadow-lg min-w-[120px]"
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
      <div className="h-[300px] -ml-6 overflow-visible w-full" style={{ width: 'calc(100% + 24px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 15, left: 0, bottom: 20 }}
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
              tick={{ 
                fontSize: 12, 
                fill: '#9ca3af',
                fontWeight: 600
              }}
              className="dark:fill-gray-400"
              padding={{ left: 0, right: 0 }}
              height={25}
              tickMargin={5}
              tickFormatter={(value) => {
                // Skip empty labels (baseline point)
                if (!value || value === '') return ''
                return value
              }}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#9ca3af'
              }}
              className="dark:fill-gray-400"
              tickFormatter={(value) => {
                if (value === 0) return '$0';
                return `$${(value/1000).toFixed(1)}k`;
              }}
              width={96}
              tickMargin={8}
              padding={{ top: 0, bottom: 0 }}
              domain={([dataMin, dataMax]: [number, number], _allowOverflow: boolean) => [
                Math.min(0, dataMin),
                Math.max(0, dataMax)
              ]}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
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
              stroke="#5B2CC9"
              strokeWidth={2.5}
              fill="none"
              connectNulls={true}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#5B2CC9",
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