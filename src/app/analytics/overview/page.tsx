'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { Trade } from '@/services/trade-data.service'
import { calculateRMultipleMetrics, formatRMultiple } from '@/utils/r-multiple'
import { useTradeMetadata } from '@/hooks/use-trade-metadata'
import { Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/use-analytics'
import { DailyCumulativePnlWidget } from '@/components/ui/daily-cumulative-pnl-widget'

type PnlMetric = 'NET P&L' | 'GROSS P&L'

function formatCurrency(n: number): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return `${sign}$${abs.toLocaleString()}`
}

function formatAxisCurrency(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return `${sign}$${abs}`
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toMonthKey(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' })
}

function formatHm(totalMinutes: number | null | undefined): string {
  if (totalMinutes == null) return 'N/A'
  const mins = Math.round(totalMinutes)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m} min${m !== 1 ? 's' : ''}`
  return `${h} hour${h !== 1 ? 's' : ''}${m ? `, ${m} minute${m !== 1 ? 's' : ''}` : ''}`
}

export default function OverviewPage() {
  usePageTitle('Analytics - Overview')

  const { getTradeMetadata } = useTradeMetadata()
  const [pnlMetric, setPnlMetric] = useState<PnlMetric>('NET P&L')
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)
  const [timeframeMenuOpen, setTimeframeMenuOpen] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '1M' | '3M' | '6M' | '1Y'>('all')
  const metricMenuRef = useRef<HTMLDivElement | null>(null)
  const timeframeMenuRef = useRef<HTMLDivElement | null>(null)

  // Use our new reactive analytics system
  const { state, loading, error, trades, updateFilters } = useAnalytics()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (metricMenuRef.current && !metricMenuRef.current.contains(e.target as Node)) {
        setMetricMenuOpen(false)
      }
      if (timeframeMenuRef.current && !timeframeMenuRef.current.contains(e.target as Node)) {
        setTimeframeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Update filters when PnL metric or timeframe changes
  useEffect(() => {
    const now = new Date()
    let dateRange = undefined

    if (selectedTimeframe !== 'all') {
      const endDate = now
      const startDate = new Date(now)
      
      switch (selectedTimeframe) {
        case '1M':
          startDate.setMonth(now.getMonth() - 1)
          break
        case '3M':
          startDate.setMonth(now.getMonth() - 3)
          break
        case '6M':
          startDate.setMonth(now.getMonth() - 6)
          break
        case '1Y':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      dateRange = { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    }

    updateFilters({
      pnlMetric: pnlMetric === 'NET P&L' ? 'NET' : 'GROSS',
      dateRange
    })
  }, [pnlMetric, selectedTimeframe, updateFilters])

  const derived = useMemo(() => {
    console.log('🔍 Derived calculation - trades:', trades?.length || 0)
    console.log('🔍 Derived calculation - trades data:', trades?.slice(0, 2)) // Show first 2 trades
    
    if (!trades?.length) {
      console.log('❌ Derived returning empty - no trades')
      return {
        totalTrades: 0,
        totals: { pnl: 0, commissions: 0, fees: 0, swap: 0 },
        avgTradePnl: 0,
        avgWinTrade: 0,
        avgLossTrade: 0,
        profitFactor: 0,
        hold: { all: null as number | null, win: null as number | null, loss: null as number | null, scratch: null as number | null },
        bestMonth: null as null | { key: string; value: number },
        worstMonth: null as null | { key: string; value: number },
        avgPerMonth: 0,
        days: { total: 0, win: 0, loss: 0, breakeven: 0 },
        streaks: { maxWinDays: 0, maxLossDays: 0 },
        daily: [] as { key: string; label: string; value: number }[],
        dailyBars: [] as { date: string; value: number }[],
        cumulative: [] as { date: string; value: number; pos: number | null; neg: number | null }[],
        largestProfitDay: 0,
        largestLossDay: 0,
        expectancy: 0,
        volumes: { avgDailyContracts: 0 },
        drawdown: { max: 0, maxPct: 0, avg: 0, avgPct: 0 },
        openTrades: 0,
        avgPlannedRMultiple: 0,
        avgRealizedRMultiple: 0,
      }
    }

    const pnlOf = (t: Trade) => {
      const gross = t.grossPnl ?? (typeof t.netPnl === 'number' ? t.netPnl : 0)
      return pnlMetric === 'GROSS P&L' ? gross : (t.netPnl ?? 0)
    }

    // Group by day
    const dailyMap = new Map<string, { value: number; contracts: number }>()
    for (const t of trades) {
      const date = new Date(t.closeDate || t.openDate)
      const key = toDateKey(date)
      const prev = dailyMap.get(key) || { value: 0, contracts: 0 }
      prev.value += pnlOf(t)
      prev.contracts += t.contractsTraded || 0
      dailyMap.set(key, prev)
    }

    const daily = [...dailyMap.entries()]
      .map(([k, v]) => ({ key: k, label: new Date(k).toLocaleDateString(), value: v.value, contracts: v.contracts }))
      .sort((a, b) => a.key.localeCompare(b.key))

    const dailyBars = daily.map(d => ({ date: d.label, value: d.value }))

    // Cumulative and drawdowns
    let running = 0
    let peak = 0
    let maxDrawdown = 0
    let sumDrawdown = 0
    let drawdownSamples = 0
    const cumulative = daily.map(d => {
      running += d.value
      peak = Math.max(peak, running)
      const dd = running - peak // <= 0
      if (dd < 0) {
        maxDrawdown = Math.min(maxDrawdown, dd)
        sumDrawdown += dd
        drawdownSamples += 1
      }
      return { date: d.label, value: running, pos: running >= 0 ? running : null, neg: running < 0 ? running : null }
    })

    const maxCumulative = Math.max(0, ...cumulative.map(c => c.value))
    const maxDrawdownPct = maxCumulative > 0 ? (Math.abs(maxDrawdown) / maxCumulative) * 100 : 0
    const avgDrawdown = drawdownSamples > 0 ? (sumDrawdown / drawdownSamples) : 0
    const avgDrawdownPct = maxCumulative > 0 ? (Math.abs(avgDrawdown) / maxCumulative) * 100 : 0

    // Day categories
    const totalDays = daily.length
    const winDays = daily.filter(d => d.value > 0).length
    const lossDays = daily.filter(d => d.value < 0).length
    const beDays = totalDays - winDays - lossDays

    // Day streaks
    let maxWinStreak = 0, maxLossStreak = 0
    let curWin = 0, curLoss = 0
    for (const d of daily) {
      if (d.value > 0) {
        curWin += 1; maxWinStreak = Math.max(maxWinStreak, curWin); curLoss = 0
      } else if (d.value < 0) {
        curLoss += 1; maxLossStreak = Math.max(maxLossStreak, curLoss); curWin = 0
      } else {
        curWin = 0; curLoss = 0
      }
    }

    // Trade-level stats
    const totalTrades = trades.length
    const wins = trades.filter(t => t.status === 'WIN')
    const losses = trades.filter(t => t.status === 'LOSS')
    const totalPnl = trades.reduce((s, t) => s + pnlOf(t), 0)
    const totalWinAmount = wins.reduce((s, t) => s + pnlOf(t), 0)
    const totalLossAmount = Math.abs(losses.reduce((s, t) => s + pnlOf(t), 0))
    const avgWinTrade = wins.length ? totalWinAmount / wins.length : 0
    const avgLossTrade = losses.length ? totalLossAmount / losses.length : 0
    const avgTradePnl = totalTrades ? totalPnl / totalTrades : 0
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0
    const winRate = totalTrades ? wins.length / totalTrades : 0
    const expectancy = winRate * avgWinTrade - (1 - winRate) * avgLossTrade

    // Largest profit/loss day
    const largestProfitDay = daily.length ? Math.max(...daily.map(d => d.value)) : 0
    const largestLossDay = daily.length ? Math.min(...daily.map(d => d.value)) : 0

    // Months
    const monthMap = new Map<string, number>()
    for (const t of trades) {
      const date = new Date(t.closeDate || t.openDate)
      const key = toMonthKey(date)
      monthMap.set(key, (monthMap.get(key) || 0) + pnlOf(t))
    }
    const months = [...monthMap.entries()].map(([k, v]) => ({ key: k, value: v }))
    const bestMonth = months.length ? months.reduce((a, b) => (b.value > a.value ? b : a)) : null
    const worstMonth = months.length ? months.reduce((a, b) => (b.value < a.value ? b : a)) : null
    const avgPerMonth = months.length ? months.reduce((s, m) => s + m.value, 0) / months.length : 0

    // Volumes
    const dayContracts = daily.map(d => d.contracts)
    const avgDailyContracts = dayContracts.length ? (dayContracts.reduce((a, b) => a + b, 0) / dayContracts.length) : 0

    // Commissions/Fees/Swap
    const commissions = trades.reduce((s, t) => s + (t.commissions || 0), 0)
    const fees = 0
    const swap = 0

    // Hold times
    const durMinutes = (t: Trade): number | null => {
      if (!t.openDate || !t.closeDate) return null
      const open = new Date(t.openDate)
      const close = new Date(t.closeDate)
      const diffMs = close.getTime() - open.getTime()
      if (!isFinite(diffMs) || diffMs < 0) return null
      return diffMs / 60000
    }
    const durations = trades.map(durMinutes).filter((n): n is number => n != null)
    const winDur = wins.map(durMinutes).filter((n): n is number => n != null)
    const lossDur = losses.map(durMinutes).filter((n): n is number => n != null)
    const scratch = trades.filter(t => (pnlOf(t) === 0)).map(durMinutes).filter((n): n is number => n != null)

    const avgAll = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null
    const avgWin = winDur.length ? winDur.reduce((a, b) => a + b, 0) / winDur.length : null
    const avgLoss = lossDur.length ? lossDur.reduce((a, b) => a + b, 0) / lossDur.length : null
    const avgScratch = scratch.length ? scratch.reduce((a, b) => a + b, 0) / scratch.length : null


    // R-Multiple calculations
    const rMultipleMetrics = calculateRMultipleMetrics(trades, getTradeMetadata)

    return {
      totalTrades,
      totals: { pnl: totalPnl, commissions, fees, swap },
      avgTradePnl,
      avgWinTrade,
      avgLossTrade,
      profitFactor,
      hold: { all: avgAll, win: avgWin, loss: avgLoss, scratch: avgScratch },
      bestMonth,
      worstMonth,
      avgPerMonth,
      days: { total: totalDays, win: winDays, loss: lossDays, breakeven: beDays },
      streaks: { maxWinDays: maxWinStreak, maxLossDays: maxLossStreak },
      daily: daily.map(d => ({ key: d.key, label: d.label, value: d.value })),
      dailyBars,
      cumulative,
      largestProfitDay,
      largestLossDay,
      expectancy,
      volumes: { avgDailyContracts },
      drawdown: { max: Math.abs(maxDrawdown), maxPct: maxDrawdownPct, avg: Math.abs(avgDrawdown), avgPct: avgDrawdownPct },
      avgPlannedRMultiple: rMultipleMetrics.avgPlannedRMultiple,
      avgRealizedRMultiple: rMultipleMetrics.avgRealizedRMultiple,
    }
  }, [trades, pnlMetric, getTradeMetadata])

  const handleTabChange = (tabId: string) => {
    console.log('Active tab:', tabId)
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    console.log(`Selected ${itemId} from ${tabId} tab`)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#0f0f0f]">
          <AnalyticsTabNavigation
            tabs={analyticsNavigationConfig.map(tab => ({
              ...tab,
              isActive: tab.id === 'overview'
            }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#0f0f0f]">
          <div className="w-full space-y-6">
            {/* Toolbar: Timeframe and P&L metric */}
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <div className="flex items-center gap-2">
              <div className="relative" ref={timeframeMenuRef}>
                <button
                  onClick={() => setTimeframeMenuOpen(o => !o)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[100px] justify-between"
                  aria-label="Select timeframe"
                  aria-expanded={timeframeMenuOpen}
                  aria-haspopup="true"
                >
                  <span>{selectedTimeframe === 'all' ? 'All Time' : selectedTimeframe}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", timeframeMenuOpen && "rotate-180")} />
                </button>
                {timeframeMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg min-w-[140px] overflow-hidden z-50">
                    {[
                      { value: 'all', label: 'All Time' },
                      { value: '1M', label: 'Last Month' },
                      { value: '3M', label: 'Last 3 Months' },
                      { value: '6M', label: 'Last 6 Months' },
                      { value: '1Y', label: 'Last Year' }
                    ].map(timeframe => (
                      <button 
                        key={timeframe.value}
                        onClick={() => { setSelectedTimeframe(timeframe.value as any); setTimeframeMenuOpen(false) }} 
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                        role="option"
                        aria-selected={selectedTimeframe === timeframe.value}
                      >
                        {timeframe.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={metricMenuRef}>
                <button
                  onClick={() => setMetricMenuOpen(o => !o)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[140px] justify-between"
                  aria-label="Select P&L metric"
                  aria-expanded={metricMenuOpen}
                  aria-haspopup="true"
                >
                  <span>{pnlMetric}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", metricMenuOpen && "rotate-180")} />
                </button>
                {metricMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg min-w-[160px] overflow-hidden z-50">
                    <button 
                      onClick={() => { setPnlMetric('NET P&L'); setMetricMenuOpen(false) }} 
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                      role="option"
                      aria-selected={pnlMetric === 'NET P&L'}
                    >
                      Net P&L
                    </button>
                    <button 
                      onClick={() => { setPnlMetric('GROSS P&L'); setMetricMenuOpen(false) }} 
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                      role="option"
                      aria-selected={pnlMetric === 'GROSS P&L'}
                    >
                      Gross P&L
                    </button>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Loading / Error */}
            {loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Loading overview...</div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
            
            {/* No Data State - Show load test data button */}
            {!loading && !error && trades?.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">No trading data found</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-300">Import CSV data or load test data to see analytics</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = '/import-data'}
                      className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                    >
                      Import CSV
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { loadTestDataFromCSV } = await import('@/utils/load-test-data')
                          await loadTestDataFromCSV()
                          window.location.reload()
                        } catch (err) {
                          console.error('Failed to load test data:', err)
                          alert('Failed to load test data. Please import CSV manually.')
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded-md hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                    >
                      Load Test Data
                    </button>
                    <button
                      onClick={async () => {
                        // Debug data flow
                        try {
                          const { DataStore } = await import('@/services/data-store.service')
                          const directTrades = DataStore.getAllTrades()
                          
                          console.log(' Debug Results:')
                          console.log('  - DataStore trades:', directTrades.length)
                          console.log('  - useAnalytics trades:', trades?.length || 0)
                          console.log('  - Loading state:', loading)
                          console.log('  - Error state:', error)
                          console.log('  - Full state:', state)
                          
                          if (directTrades.length > 0) {
                            alert(`DataStore has ${directTrades.length} trades, but useAnalytics shows ${trades?.length || 0} trades. Check console for details.`)
                          } else {
                            alert('DataStore is empty. CSV import may have failed.')
                          }
                        } catch (err) {
                          console.error('Debug failed:', err)
                          alert('Debug failed. Check console.')
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200 rounded-md hover:bg-orange-200 dark:hover:bg-orange-700 transition-colors"
                    >
                      Debug
                    </button>
                    <button
                      onClick={() => {
                        console.log(' Refreshing analytics page...')
                        window.location.reload()
                      }}
                      className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-md hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Your Stats */}
                <section className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6">
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">YOUR STATS</h2>
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">(ALL DATES)</p>
                  </div>

                  {/* Top Row: Best/Lowest/Average Month */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Best month</div>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{derived.bestMonth ? formatCurrency(derived.bestMonth.value) : '—'}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{derived.bestMonth ? `in ${monthLabel(derived.bestMonth.key)}` : '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Lowest month</div>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{derived.worstMonth ? formatCurrency(derived.worstMonth.value) : '—'}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{derived.worstMonth ? `in ${monthLabel(derived.worstMonth.key)}` : '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Average</div>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(derived.avgPerMonth)}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">per Month</div>
                    </div>
                  </div>

                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                    {/* Left Column */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Total P&L</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.totals.pnl)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average daily volume</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.volumes.avgDailyContracts.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average winning trade</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.avgWinTrade)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average losing trade</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(-derived.avgLossTrade)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Total number of trades</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.totalTrades}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Number of winning trades</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{trades.filter(t => t.status === 'WIN').length}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Number of losing trades</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{trades.filter(t => t.status === 'LOSS').length}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Number of break even trades</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{trades.filter(t => (t.netPnl ?? 0) === 0).length}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Max consecutive wins</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.streaks.maxWinDays}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Max consecutive losses</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.streaks.maxLossDays}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Total commissions</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.totals.commissions)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Total fees</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.totals.fees)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Total swap</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.totals.swap)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Largest profit</span>
                        <span className="text-sm font-semibold text-teal-600">{formatCurrency(Math.max(0, derived.largestProfitDay))}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Largest loss</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(Math.min(0, derived.largestLossDay))}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average hold time (All trades)</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatHm(derived.hold.all)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average hold time (Winning trades)</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatHm(derived.hold.win)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average hold time (Losing trades)</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatHm(derived.hold.loss)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average hold time (Scratch trades)</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatHm(derived.hold.scratch)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average trade P&L</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.avgTradePnl)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Profit factor</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.profitFactor.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Total trading days</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.days.total}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Winning days</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.days.win}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Losing days</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.days.loss}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Breakeven days</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.days.breakeven}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Max consecutive winning days</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.streaks.maxWinDays}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Max consecutive losing days</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{derived.streaks.maxLossDays}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average daily P&L</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.days.total ? (derived.totals.pnl / derived.days.total) : 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average winning day P&L</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.days.win ? (derived.daily.filter((d) => d.value > 0).reduce((s: number, d: { value: number }) => s + d.value, 0) / derived.days.win) : 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average losing day P&L</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(derived.days.loss ? (derived.daily.filter((d) => d.value < 0).reduce((s: number, d: { value: number }) => s + d.value, 0) / derived.days.loss) : 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Largest profitable day (Profits)</span>
                        <span className="text-sm font-semibold text-teal-600">{formatCurrency(Math.max(0, derived.largestProfitDay))}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Largest losing day (Losses)</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(Math.min(0, derived.largestLossDay))}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average planned R-Multiple</span>
                        <span className={`text-sm font-semibold ${derived.avgPlannedRMultiple >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                          {formatRMultiple(derived.avgPlannedRMultiple)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average realized R-Multiple</span>
                        <span className={`text-sm font-semibold ${derived.avgRealizedRMultiple >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                          {formatRMultiple(derived.avgRealizedRMultiple)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Trade expectancy</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(derived.expectancy)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Max drawdown</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(-derived.drawdown.max)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Max drawdown, %</span>
                        <span className="text-sm font-semibold text-red-600">{-derived.drawdown.maxPct.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average drawdown</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(-derived.drawdown.avg)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Average drawdown, %</span>
                        <span className="text-sm font-semibold text-red-600">{-derived.drawdown.avgPct.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Charts Section */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Cumulative P&L */}
                  <DailyCumulativePnlWidget />

                  {/* Daily P&L Bars */}
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{pnlMetric.split(' ')[0]} DAILY P&L</h3>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">(ALL DATES)</span>
                    </div>
                    <div className="h-64">
                      {derived.dailyBars.length === 0 ? (
                        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800/20 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
                          <div className="text-center">
                            <div className="text-gray-400 dark:text-gray-500 mb-2">
                              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">No daily P&L data</p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={derived.dailyBars}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={formatAxisCurrency} />
                          <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Daily P&L']} />
                          <Bar dataKey="value">
                            {derived.dailyBars.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}