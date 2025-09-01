'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'

interface ReportDataPoint {
  date: string
  winPercent: number
  avgWin: number
  avgLoss: number
}

type TimePeriod = 'Day' | 'Week' | 'Month'

// Generate report data from real trades
const generateReportData = (trades: Trade[], period: TimePeriod): ReportDataPoint[] => {
  if (trades.length === 0) return []

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.closeDate || a.openDate).getTime() - new Date(b.closeDate || b.openDate).getTime()
  )

  const reportData: ReportDataPoint[] = []
  const groupedTrades: Record<string, Trade[]> = {}

  // Group trades by time period
  sortedTrades.forEach(trade => {
    const tradeDate = new Date(trade.closeDate || trade.openDate)
    let groupKey: string

    switch (period) {
      case 'Day':
        groupKey = tradeDate.toISOString().split('T')[0] // YYYY-MM-DD
        break
      case 'Week':
        const weekStart = new Date(tradeDate)
        weekStart.setDate(tradeDate.getDate() - tradeDate.getDay())
        groupKey = weekStart.toISOString().split('T')[0]
        break
      case 'Month':
        groupKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        groupKey = tradeDate.toISOString().split('T')[0]
    }

    if (!groupedTrades[groupKey]) {
      groupedTrades[groupKey] = []
    }
    groupedTrades[groupKey].push(trade)
  })

  // Calculate metrics for each period
  let runningTrades: Trade[] = []
  
  Object.keys(groupedTrades).sort().forEach(dateKey => {
    runningTrades = [...runningTrades, ...groupedTrades[dateKey]]
    
    const winners = runningTrades.filter(t => t.netPnl > 0)
    const losers = runningTrades.filter(t => t.netPnl < 0)
    
    const winPercent = runningTrades.length > 0 ? (winners.length / runningTrades.length) * 100 : 0
    const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.netPnl, 0) / winners.length : 0
    const avgLoss = losers.length > 0 ? losers.reduce((sum, t) => sum + t.netPnl, 0) / losers.length : 0

    // Format date for display
    let displayDate: string
    const date = new Date(dateKey)
    
    switch (period) {
      case 'Day':
        displayDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
        break
      case 'Week':
        displayDate = `W${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`
        break
      case 'Month':
        displayDate = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        break
      default:
        displayDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
    }

    reportData.push({
      date: displayDate,
      winPercent: Math.round(winPercent),
      avgWin: Math.round(avgWin),
      avgLoss: Math.round(avgLoss)
    })
  })

  return reportData.slice(-18) // Show last 18 data points
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
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
  const [trades, setTrades] = useState<Trade[]>([])
  const selectedPeriod: TimePeriod = 'Day'

  // Load trades and subscribe to changes
  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  // Generate report data from real trades
  const reportData = useMemo(() => generateReportData(trades, selectedPeriod), [trades, selectedPeriod])

  if (!trades.length) {
    return (
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white" style={{ height: '432px' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report</h3>
            <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-[#2a2a2a] flex items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
            </div>
          </div>
        </div>
        
        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
        
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-center">
            <div>No report data available</div>
            <div className="text-sm mt-1">Import your CSV to see performance reports</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white" style={{ height: '432px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report</h3>
          <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-[#2a2a2a] flex items-center justify-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
          </div>
        </div>
      </div>
      
      {/* Header Divider */}
      <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
      
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
            
            <Tooltip content={<CustomTooltip />} cursor={false} />
            
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