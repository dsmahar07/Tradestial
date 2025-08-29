'use client'

import { useState, useEffect } from 'react'
import { DataStore } from '@/services/data-store.service'
import { motion } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface AccountBalanceData {
  date: string
  accountBalance: number // Starting balance + cumulative P&L (violet line)
  startingBalance: number // Constant starting balance (red line)
}

interface AccountBalanceChartProps {
  className?: string
  data?: AccountBalanceData[]
  title?: string
  timeRanges?: string[]
  height?: number
}

const defaultData: AccountBalanceData[] = [
  { date: '06/20/25', accountBalance: 5000, startingBalance: 5000 },
  { date: '06/25/25', accountBalance: 4800, startingBalance: 5000 },
  { date: '07/01/25', accountBalance: 5200, startingBalance: 5000 },
  { date: '07/05/25', accountBalance: 5500, startingBalance: 5000 },
  { date: '07/10/25', accountBalance: 5300, startingBalance: 5000 },
  { date: '07/15/25', accountBalance: 6000, startingBalance: 5000 },
  { date: '07/18/25', accountBalance: 5800, startingBalance: 5000 },
  { date: '07/25/25', accountBalance: 8000, startingBalance: 5000 },
  { date: '08/01/25', accountBalance: 12000, startingBalance: 5000 },
  { date: '08/05/25', accountBalance: 15000, startingBalance: 5000 },
]

const defaultTimeRanges = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']

export function AccountBalanceChart({ 
  className = "", 
  data,
  title = "Account balance",
  timeRanges = defaultTimeRanges,
  height = 385
}: AccountBalanceChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('ALL')
  const [chartData, setChartData] = useState<AccountBalanceData[]>(data || [])
  const [hasData, setHasData] = useState<boolean>(() => DataStore.getAllTrades().length > 0)

  useEffect(() => {
    const loadAccountBalanceData = () => {
      const trades = DataStore.getAllTrades()
      
      if (trades.length === 0) {
        setHasData(false)
        setChartData([])
        return
      }

      const startingBalance = DataStore.getStartingBalance()
      
      // Create account balance progression over time
      const dailyGroups = trades.reduce((groups, trade) => {
        const day = trade.openDate.split('T')[0] // Get YYYY-MM-DD part
        if (!groups[day]) groups[day] = []
        groups[day].push(trade)
        return groups
      }, {} as Record<string, any[]>)

      const sortedDays = Object.keys(dailyGroups).sort()
      let runningBalance = startingBalance

      const realData: AccountBalanceData[] = sortedDays.map((day, index) => {
        const dayTrades = dailyGroups[day]
        const dayPnL = dayTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
        runningBalance += dayPnL
        
        return {
          date: new Date(day).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
          accountBalance: runningBalance, // Starting balance + cumulative P&L (violet line)
          startingBalance: startingBalance // Constant starting balance (red line)
        }
      })

      // Add starting point if we have data
      if (realData.length > 0) {
        const firstDate = new Date(sortedDays[0])
        firstDate.setDate(firstDate.getDate() - 1)
        
        realData.unshift({
          date: firstDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
          accountBalance: startingBalance, // Both start at the same point
          startingBalance: startingBalance
        })
      }

      setHasData(realData.length > 0)
      setChartData(realData)
    }

    // Load initial data
    loadAccountBalanceData()

    // Subscribe to data changes
    const unsubscribe = DataStore.subscribe(loadAccountBalanceData)
    return unsubscribe
  }, [])

  const actualData = data || chartData

  const formatCurrency = (value: number) => {
    // Full currency with thousands separators, e.g. $60,000
    return `$${Math.round(value).toLocaleString()}`
  }

  const formatTooltipValue = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  const maxValue = Math.max(
    ...actualData.map(d => Math.max(d.accountBalance, d.startingBalance))
  )

  const getYAxisTicks = () => {
    const step = Math.ceil(maxValue / 6 / 10000) * 10000
    const ticks = []
    for (let i = 0; i <= Math.ceil(maxValue / step); i++) {
      ticks.push(i * step)
    }
    return ticks
  }

  // Use raw data so deposits line sits on $0 until the spike

  // Tooltip styled like Performance Analysis widget (light/dark)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-xs">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {entry.name === 'accountBalance' ? 'Account Balance' : 'Starting Balance'}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {formatTooltipValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div 
      className={`bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-gray-100 relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626] ${className}`}
      style={{ height: `${height}px` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Time Range Selector (hide in empty state) */}
        {hasData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {selectedTimeRange}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a]">
              {timeRanges.map((range) => (
                <DropdownMenuItem
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  {range}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {hasData ? (
        <>
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5B2CC9' }}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Account Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FB3748' }}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Starting Balance</span>
            </div>
          </div>

          {/* Chart */}
          <div
            className="h-[280px] overflow-visible w-full"
            style={{ marginLeft: -20, width: 'calc(100% + 20px)' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={actualData}
                margin={{ top: 20, right: 16, left: 0, bottom: 25 }}
              >
                <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" vertical={false} style={{ shapeRendering: 'crispEdges' }} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 0, right: 0 }}
                  tick={{ 
                    fontSize: 12, 
                    fill: '#9ca3af',
                    fontWeight: 600
                  }}
                  className="dark:fill-gray-400"
                  height={25}
                  tickMargin={5}
                />
                <YAxis 
                  stroke="#6b7280"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrency}
                  domain={[0, 'dataMax + 5000']}
                  ticks={getYAxisTicks()}
                  width={68}
                  tick={{ 
                    dx: -12, 
                    textAnchor: 'end', 
                    fontSize: 10, 
                    fill: '#9ca3af'
                  }}
                  className="dark:fill-gray-400"
                  tickMargin={2}
                  scale="linear"
                  allowDecimals={false}
                  padding={{ top: 0, bottom: 0 }}
                />
                {/* Zero baseline reference (same brightness as grid) */}
                <ReferenceLine y={0} stroke="var(--grid)" strokeDasharray="3 3" strokeWidth={1} style={{ shapeRendering: 'crispEdges' }} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                {/* Violet line: Account Balance (starting balance + cumulative P&L) */}
                <Line
                  type="linear"
                  dataKey="accountBalance"
                  stroke="#5B2CC9"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ shapeRendering: 'geometricPrecision', vectorEffect: 'non-scaling-stroke' } as React.CSSProperties}
                  activeDot={{ r: 4, fill: '#5B2CC9' }}
                />
                {/* Red line: Starting Balance (constant baseline) */}
                <Line
                  type="linear"
                  dataKey="startingBalance"
                  stroke="#FB3748"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ shapeRendering: 'geometricPrecision', vectorEffect: 'non-scaling-stroke' } as React.CSSProperties}
                  activeDot={{ r: 4, fill: '#FB3748' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        // Empty state (matches Performance Radar)
        <div className="h-[320px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">No symbol data available</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Import your CSV to see symbol performance</div>
          </div>
        </div>
      )}
    </motion.div>
  )
}