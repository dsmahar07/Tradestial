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
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

// Sample report data
const reportData = [
  { date: '06/19/25', winPercent: 100, avgWin: 4000, avgLoss: 0 },
  { date: '06/22/25', winPercent: 100, avgWin: 4000, avgLoss: 0 },
  { date: '06/24/25', winPercent: 100, avgWin: 4000, avgLoss: 0 },
  { date: '06/26/25', winPercent: 80, avgWin: 3200, avgLoss: -400 },
  { date: '06/29/25', winPercent: 80, avgWin: 3200, avgLoss: -600 },
  { date: '07/01/25', winPercent: 60, avgWin: 2400, avgLoss: -800 },
  { date: '07/03/25', winPercent: 50, avgWin: 2000, avgLoss: -800 },
  { date: '07/08/25', winPercent: 60, avgWin: 2400, avgLoss: -1000 },
  { date: '07/10/25', winPercent: 60, avgWin: 2400, avgLoss: -1200 },
  { date: '07/15/25', winPercent: 50, avgWin: 2000, avgLoss: -1400 },
  { date: '07/17/25', winPercent: 50, avgWin: 2000, avgLoss: -1600 },
  { date: '07/22/25', winPercent: 50, avgWin: 2000, avgLoss: -1600 },
  { date: '07/24/25', winPercent: 55, avgWin: 2200, avgLoss: -1600 },
  { date: '07/29/25', winPercent: 55, avgWin: 2200, avgLoss: -1600 },
  { date: '07/31/25', winPercent: 55, avgWin: 2200, avgLoss: -1600 },
  { date: '08/05/25', winPercent: 50, avgWin: 2000, avgLoss: -1600 },
  { date: '08/07/25', winPercent: 50, avgWin: 2000, avgLoss: -1600 },
  { date: '08/12/25', winPercent: 50, avgWin: 2000, avgLoss: -1600 }
]

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="text-gray-600 dark:text-gray-300 font-medium mb-1">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {entry.name}: {entry.name === 'Win %' ? `${entry.value}%` : `$${Math.abs(entry.value).toLocaleString()}`}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export const ReportChart = React.memo(function ReportChart() {
  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white" style={{ height: '385px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report</h3>
          <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-[#2a2a2a] flex items-center justify-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
              >
                <span>Day</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] shadow-lg min-w-[120px]"
            >
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Day
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Week
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-[300px] -ml-6 overflow-visible w-full" style={{ width: 'calc(100% + 24px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={reportData}
            margin={{ top: 20, right: 15, left: 0, bottom: 25 }}
          >
            {/* Left Y-Axis for percentage */}
            <YAxis 
              yAxisId="percent"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#9ca3af'
              }}
              className="dark:fill-gray-400"
              tickFormatter={(value) => `${value}%`}
              domain={[0, 120]}
              width={55}
            />
            
            {/* Right Y-Axis for dollar amounts */}
            <YAxis 
              yAxisId="dollar"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#9ca3af'
              }}
              className="dark:fill-gray-400"
              tickFormatter={(value) => `$${Math.abs(value / 1000).toFixed(1)}k`}
              domain={[-2000, 5000]}
              width={55}
            />
            
            <XAxis 
              dataKey="date" 
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
              interval="preserveStartEnd"
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Win % Line - Green, uses percentage axis */}
            <Line
              yAxisId="percent"
              type="monotone"
              dataKey="winPercent"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              name="Win %"
            />
            
            {/* Avg Win Line - Blue, uses dollar axis */}
            <Line
              yAxisId="dollar"
              type="monotone"
              dataKey="avgWin"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              name="Avg win"
            />
            
            {/* Avg Loss Line - Orange, uses dollar axis */}
            <Line
              yAxisId="dollar"
              type="monotone"
              dataKey="avgLoss"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
              name="Avg loss"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})