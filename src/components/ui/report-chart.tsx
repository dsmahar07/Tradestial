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
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'

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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 text-sm">
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
          <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
              >
                <span>Day</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-600 shadow-lg min-w-[120px]"
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
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={reportData}
            margin={{ top: 15, right: 5, left: 5, bottom: 35 }}
          >
            {/* Left Y-Axis for percentage */}
            <YAxis 
              yAxisId="percent"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 120]}
              width={50}
            />
            
            {/* Right Y-Axis for dollar amounts */}
            <YAxis 
              yAxisId="dollar"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `$${Math.abs(value / 1000).toFixed(1)}k`}
              domain={[-2000, 5000]}
              width={50}
            />
            
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
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

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-300">Win %</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-600 dark:text-gray-300">Avg win</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-600 dark:text-gray-300">Avg loss</span>
        </div>
      </div>
    </div>
  )
})