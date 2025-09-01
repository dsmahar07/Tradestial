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
  index?: number // Index for X-axis positioning
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
  height = 432
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
        setHasData(true)
        setChartData(defaultData)
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

    // Subscribe to both sources to be robust: account-level and global datastore
    const unsubAccount = accountService.subscribe(loadAccountBalanceData)
    const unsubDataStore = DataStore.subscribe(loadAccountBalanceData)
    
    return () => {
      unsubAccount()
      unsubDataStore()
    }
  }, [accountId])

  const actualData = data || chartData

  const formatCurrency = (value: number) => {
    // Full currency with thousands separators, e.g. $60,000
    return `$${Math.round(value).toLocaleString()}`
  }

  const formatTooltipValue = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  // Compute dynamic Y-axis domain with padding; let Recharts pick nice ticks
  const yDomain = useMemo(() => {
    if (!actualData || actualData.length === 0) {
      return { min: 0, max: 1 }
    }
    const values: number[] = []
    for (const d of actualData) {
      if (typeof d.accountBalance === 'number' && isFinite(d.accountBalance)) values.push(d.accountBalance)
      if (typeof d.startingBalance === 'number' && isFinite(d.startingBalance)) values.push(d.startingBalance)
    }
    if (values.length === 0) return { min: 0, max: 1 }

    let min = Math.min(...values)
    let max = Math.max(...values)
    if (min === max) {
      const pad = Math.max(Math.abs(min) * 0.1, 1000)
      min -= pad
      max += pad
    } else {
      const range = max - min
      const pad = Math.max(range * 0.08, 500) // at least $500 pad
      min -= pad
      max += pad
    }
    return { min, max }
  }, [actualData])

  // Use raw data so deposits line sits on $0 until the spike

  // Tooltip styled like Performance Analysis widget (light/dark)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
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

  // Exact baseline reference (ensures a dashed line aligns with Starting Balance)
  const baselineY = useMemo(() => {
    if (!actualData || actualData.length === 0) return undefined
    const first = actualData[0]
    const sb = typeof first.startingBalance === 'number' ? first.startingBalance : undefined
    return Number.isFinite(sb) ? (sb as number) : undefined
  }, [actualData])

  return (
    <motion.div 
      className={`bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-gray-100 relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626] overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      {title && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          
          {/* Header Divider */}
          <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
        </>
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
        
        {/* Chart Container */}
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={actualData}
                margin={{ top: 20, right: 5, left: -10, bottom: 10 }}
              >
                <CartesianGrid stroke="none" vertical={false} horizontal={false} />
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
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 11, 
                    fill: '#9ca3af'
                  }}
                  className="dark:fill-gray-400"
                  tickFormatter={formatCurrency}
                  domain={[yDomain.min, yDomain.max]}
                  tickCount={6}
                  scale="linear"
                  allowDecimals={false}
                />
                {baselineY !== undefined && (
                  <ReferenceLine
                    y={baselineY}
                    stroke="var(--grid)"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    ifOverflow="visible"
                  />
                )}
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
                  style={{ shapeRendering: 'geometricPrecision' } as React.CSSProperties}
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
                  style={{ shapeRendering: 'geometricPrecision' } as React.CSSProperties}
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