'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DataStore } from '@/services/data-store.service'
import { accountService } from '@/services/account.service'
import { motion } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { Button } from './button'
import { formatDisplayTime, getDisplayTimezone } from '@/utils/display-time'
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
  className?: string;
  accountId?: string; // Add accountId to fetch specific account data
  data?: AccountBalanceData[];
  title?: string;
  timeRanges?: string[];
  height?: number;
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
  accountId,
  data,
  title = "Account balance",
  timeRanges = defaultTimeRanges,
  height = 385
}: AccountBalanceChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('ALL')
  const [chartData, setChartData] = useState<AccountBalanceData[]>(data || [])
  const [hasData, setHasData] = useState<boolean>(false)

  useEffect(() => {
    const loadAccountBalanceData = () => {
      let trades = [];
      let startingBalance = 0;

      if (accountId) {
        const account = accountService.getAccountById(accountId);
        if (account) {
          trades = account.trades;
          startingBalance = account.balance.starting;
        } else {
          setHasData(false);
          setChartData([]);
          return;
        }
      } else {
        trades = DataStore.getAllTrades();
        startingBalance = DataStore.getStartingBalance();
      }
      
      if (trades.length === 0) {
        setHasData(false)
        setChartData([])
        return
      }

      const dailyGroups = trades.reduce((groups, trade) => {
        const day = trade.openDate.split('T')[0]
        if (!groups[day]) groups[day] = []
        groups[day].push(trade)
        return groups
      }, {} as Record<string, any[]>)

      const sortedDays = Object.keys(dailyGroups).sort()
      let runningBalance = startingBalance

      const realData: AccountBalanceData[] = sortedDays.map((day) => {
        const dayTrades = dailyGroups[day]
        const dayPnL = dayTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
        runningBalance += dayPnL
        
        return {
          date: formatDisplayTime(day, { timezone: getDisplayTimezone() }).split(' ')[0],
          accountBalance: runningBalance,
          startingBalance: startingBalance
        }
      })

      if (realData.length > 0) {
        const firstDate = new Date(sortedDays[0])
        firstDate.setDate(firstDate.getDate() - 1)
        
        realData.unshift({
          date: formatDisplayTime(firstDate.toISOString().split('T')[0], { timezone: getDisplayTimezone() }).split(' ')[0],
          accountBalance: startingBalance,
          startingBalance: startingBalance
        })
      }

      setHasData(realData.length > 0)
      setChartData(realData)
    }

    loadAccountBalanceData()

    const unsubscribe = accountId 
      ? accountService.subscribe(loadAccountBalanceData)
      : DataStore.subscribe(loadAccountBalanceData);
      
    return unsubscribe
  }, [accountId])

  const actualData = data || chartData

  const formatCurrency = (value: number) => {
    // Full currency with thousands separators, e.g. $60,000
    return `$${Math.round(value).toLocaleString()}`
  }

  const formatTooltipValue = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  // Compute dynamic Y-axis ticks across both series (accountBalance & startingBalance)
  const yTicks = useMemo(() => {
    if (!actualData || actualData.length === 0) return [0]
    const values: number[] = []
    for (const d of actualData) {
      if (typeof d.accountBalance === 'number' && isFinite(d.accountBalance)) values.push(d.accountBalance)
      if (typeof d.startingBalance === 'number' && isFinite(d.startingBalance)) values.push(d.startingBalance)
    }
    if (values.length === 0) return [0]

    const min = Math.min(...values)
    const max = Math.max(...values)

    // Guard single-value or flat series
    if (min === max) {
      const pad = Math.max(1, Math.abs(min) * 0.1)
      return [min - 2 * pad, min - pad, min, min + pad, min + 2 * pad]
    }

    // Nice step calculation for ~6 segments
    const range = max - min
    const rawStep = range / 6
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, Math.abs(rawStep)))))
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude

    // Expand to nice bounds
    const niceMin = Math.floor(min / niceStep) * niceStep
    const niceMax = Math.ceil(max / niceStep) * niceStep

    const ticks: number[] = []
    for (let v = niceMin; v <= niceMax + 1e-9; v += niceStep) {
      ticks.push(Number(v.toFixed(10)))
    }
    return ticks
  }, [actualData])

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
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
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
                {/* Disable horizontal grid; we'll draw labeled-only lines per Y tick below */}
                <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" vertical={false} horizontal={false} style={{ shapeRendering: 'crispEdges' }} />
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
                  domain={[Math.min(...yTicks), Math.max(...yTicks)]}
                  ticks={yTicks}
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
                {/* Draw horizontal grid lines exactly at labeled ticks */}
                {yTicks.map((t) => (
                  <ReferenceLine
                    key={`grid-${t}`}
                    y={t}
                    stroke="var(--grid)"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    ifOverflow="visible"
                    style={{ shapeRendering: 'crispEdges' }}
                  />
                ))}
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