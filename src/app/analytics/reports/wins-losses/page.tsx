'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAnalytics } from '@/hooks/use-analytics'
import { cn } from '@/lib/utils'
import type { Trade } from '@/services/trade-data.service'
import type { ChartDataPoint } from '@/types/performance'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts'

export default function WinsLossesPage() {
  usePageTitle('Analytics - Wins vs Losses')

  // Get real trade data
  const { trades, loading, error } = useAnalytics()

  // UI controls
  const [pnlMetric, setPnlMetric] = useState<'NET P&L' | 'GROSS P&L'>('NET P&L')
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)
  const metricMenuRef = useRef<HTMLDivElement>(null)

  // Calculate cumulative series from real trades
  const { winsCumulativeSeries, lossesCumulativeSeries } = useMemo(() => {
    if (!trades?.length) {
      return { winsCumulativeSeries: [], lossesCumulativeSeries: [] }
    }

    // Group trades by day and calculate cumulative
    const dailyWins = new Map<string, number>()
    const dailyLosses = new Map<string, number>()

    trades.forEach(trade => {
      const pnl = pnlMetric === 'NET P&L' ? trade.netPnl : (trade.grossPnl || trade.netPnl)
      const date = toISODate(safeDate(trade.closeDate || trade.openDate))

      if (pnl > 0) {
        dailyWins.set(date, (dailyWins.get(date) || 0) + pnl)
      } else if (pnl < 0) {
        dailyLosses.set(date, (dailyLosses.get(date) || 0) + Math.abs(pnl))
      }
    })

    // Create sorted date array and build cumulative series
    const allDays = Array.from(new Set([...dailyWins.keys(), ...dailyLosses.keys()]))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    const winsSeries: ChartDataPoint[] = []
    const lossesSeries: ChartDataPoint[] = []
    let cumulativeWins = 0
    let cumulativeLosses = 0

    allDays.forEach(date => {
      cumulativeWins += dailyWins.get(date) || 0
      cumulativeLosses += dailyLosses.get(date) || 0
      
      winsSeries.push({ date, value: fmt(cumulativeWins) })
      lossesSeries.push({ date, value: fmt(cumulativeLosses) })
    })

    return {
      winsCumulativeSeries: winsSeries,
      lossesCumulativeSeries: lossesSeries
    }
  }, [trades, pnlMetric])

  // Helpers
  const toISODate = (d: Date) => d.toISOString().slice(0, 10)
  const safeDate = (s: string) => new Date(s)
  const fmt = (n: number) => Number((n ?? 0).toFixed(2))
  const pnlOf = (t: Trade) => (pnlMetric === 'NET P&L' ? (t.netPnl ?? 0) : (t.grossPnl ?? t.netPnl ?? 0))

  // Stats per side
  type StatRow = { label: string; value: string }

  const stats = useMemo(() => {
    if (!trades?.length) return { wins: [], losses: [], maxConsecutiveWins: 0, maxConsecutiveLosses: 0 }

    const sortedByTime = [...trades].sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime())
    
    // Max consecutive wins/losses across the full sequence
    let maxWins = 0, maxLosses = 0, curWins = 0, curLosses = 0
    for (const t of sortedByTime) {
      const pnl = pnlOf(t)
      if (pnl > 0) { 
        curWins += 1; curLosses = 0 
      } else if (pnl < 0) { 
        curLosses += 1; curWins = 0 
      }
      maxWins = Math.max(maxWins, curWins)
      maxLosses = Math.max(maxLosses, curLosses)
    }

    const wins = trades.filter(t => pnlOf(t) > 0)
    const losses = trades.filter(t => pnlOf(t) < 0)

    const sum = (arr: Trade[], fn: (t: Trade) => number) => arr.reduce((s, t) => s + fn(t), 0)

    const totalPnlWins = sum(wins, pnlOf)
    const totalPnlLosses = sum(losses, pnlOf)

    const avgWinningTradeWins = wins.length ? sum(wins, pnlOf) / wins.length : 0
    const avgLosingTradeLosses = losses.length ? Math.abs(sum(losses, pnlOf)) / losses.length : 0

    // Avg daily volume
    const avgDailyVol = (arr: Trade[]) => {
      const m = new Map<string, number>()
      for (const t of arr) {
        const d = toISODate(safeDate(t.closeDate || t.openDate))
        m.set(d, (m.get(d) || 0) + (t.contractsTraded || 0))
      }
      if (!m.size) return 0
      const total = Array.from(m.values()).reduce((a, b) => a + b, 0)
      return total / m.size
    }

    const totalCommissionsWins = sum(wins, t => t.commissions || 0)
    const totalCommissionsLosses = sum(losses, t => t.commissions || 0)

    return {
      meta: {
        winsCount: wins.length,
        lossesCount: losses.length
      },
      wins: [
        { label: 'Total P&L', value: `$${Math.abs(totalPnlWins).toLocaleString()}` },
        { label: 'Average daily volume', value: avgDailyVol(wins).toFixed(2) },
        { label: 'Average winning trade', value: wins.length ? `$${Math.abs(avgWinningTradeWins).toFixed(2)}` : 'N/A' },
        { label: 'Average losing trade', value: 'N/A' },
        { label: 'Number of winning trades', value: String(wins.length) },
        { label: 'Number of losing trades', value: '0' },
        { label: 'Total commissions', value: String(totalCommissionsWins) },
        { label: 'Max consecutive wins', value: String(maxWins) }
      ] as StatRow[],
      losses: [
        { label: 'Total P&L', value: `$${Math.abs(totalPnlLosses).toLocaleString()}` },
        { label: 'Average daily volume', value: avgDailyVol(losses).toFixed(2) },
        { label: 'Average winning trade', value: 'N/A' },
        { label: 'Average losing trade', value: losses.length ? `$${Math.abs(avgLosingTradeLosses).toFixed(2)}` : 'N/A' },
        { label: 'Number of winning trades', value: '0' },
        { label: 'Number of losing trades', value: String(losses.length) },
        { label: 'Total commissions', value: String(totalCommissionsLosses) },
        { label: 'Max consecutive losses', value: String(maxLosses) }
      ] as StatRow[]
    }
  }, [trades, pnlMetric])

  // Axis formatter
  const formatAxisCurrency = (value: number): string => {
    const v = Math.abs(value)
    if (v >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
    return `$${value.toFixed(0)}`
  }

  // Chart data with pos/neg splits for dual-area fill
  const winsChartData = useMemo(() =>
    winsCumulativeSeries.map(p => ({
      ...p,
      pos: p.value >= 0 ? p.value : 0,
      neg: p.value < 0 ? p.value : 0
    })),
    [winsCumulativeSeries]
  )

  const lossesChartData = useMemo(() =>
    lossesCumulativeSeries.map(p => ({
      ...p,
      pos: p.value >= 0 ? p.value : 0,
      neg: p.value < 0 ? p.value : 0
    })),
    [lossesCumulativeSeries]
  )

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (metricMenuRef.current && !metricMenuRef.current.contains(target)) setMetricMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Navigation helpers
  const handleTabChange = (tabId: string) => { console.log('Active tab:', tabId) }
  const handleDropdownItemClick = (tabId: string, itemId: string) => { console.log(`Selected ${itemId} from ${tabId} tab`) }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#171717]">
          <AnalyticsTabNavigation 
            tabs={analyticsNavigationConfig.map(tab => ({
              ...tab,
              isActive: tab.id === 'reports'
            }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#1C1C1C]">
          <div className="w-full space-y-6">
            {/* Toolbar: only P&L metric dropdown (right-aligned) */}
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {/* P&L metric */}
              <div className="relative" ref={metricMenuRef}>
                <button
                  onClick={() => setMetricMenuOpen(o => !o)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[140px] justify-between"
                  aria-label="Select P&L metric"
                  aria-expanded={metricMenuOpen}
                  aria-haspopup="true"
                >
                  <span>{pnlMetric}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", metricMenuOpen && "rotate-180")} />
                </button>
                {metricMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[160px] overflow-hidden z-50">
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

            {/* Loading / Error Indicators */}
            {loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Loading trades...</div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}

            {/* Panels: Wins and Losses */}
            {!loading && !error && (
              <div className="space-y-6">
                {/* Charts Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Wins Chart */}
                  <section className="bg-white dark:bg-[#171717] rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {pnlMetric === 'GROSS P&L' ? 'DAILY GROSS CUMULATIVE P&L (WINS)' : 'DAILY NET CUMULATIVE P&L (WINS)'}
                      </h3>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">(ALL DATES)</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ml-auto"></div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={winsChartData}>
                          <defs>
                            <linearGradient id="winsGreenGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(34,197,94,0.8)" />
                              <stop offset="100%" stopColor="rgba(34,197,94,0.2)" />
                            </linearGradient>
                            <linearGradient id="winsRedGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(239,68,68,0.8)" />
                              <stop offset="100%" stopColor="rgba(239,68,68,0.2)" />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            tickFormatter={formatAxisCurrency}
                            domain={([dataMin, dataMax]: [number, number]) => [
                              Math.floor(Math.min(0, dataMin) * 1.1),
                              Math.ceil(Math.max(0, dataMax) * 1.2)
                            ]}
                          />
                          <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Cumulative P&L']} />
                          {/* Positive area */}
                          <Area
                            type="monotone"
                            dataKey="pos"
                            stroke="none"
                            fill="url(#winsGreenGradient)"
                            fillOpacity={0.7}
                            isAnimationActive={false}
                            baseValue={0}
                            connectNulls
                          />
                          {/* Negative area */}
                          <Area
                            type="monotone"
                            dataKey="neg"
                            stroke="none"
                            fill="url(#winsRedGradient)"
                            fillOpacity={0.7}
                            isAnimationActive={false}
                            baseValue={0}
                            connectNulls
                          />
                          {/* Main stroke */}
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#2E22B9"
                            strokeWidth={2}
                            fill="transparent"
                            isAnimationActive={false}
                            connectNulls
                          />
                          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} ifOverflow="extendDomain" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Losses Chart */}
                  <section className="bg-white dark:bg-[#171717] rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {pnlMetric === 'GROSS P&L' ? 'DAILY GROSS CUMULATIVE P&L (LOSSES)' : 'DAILY NET CUMULATIVE P&L (LOSSES)'}
                      </h3>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">(ALL DATES)</span>
                      <div className="w-2 h-2 rounded-full bg-red-500 ml-auto"></div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lossesChartData}>
                          <defs>
                            <linearGradient id="lossesGreenGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(34,197,94,0.8)" />
                              <stop offset="100%" stopColor="rgba(34,197,94,0.2)" />
                            </linearGradient>
                            <linearGradient id="lossesRedGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(239,68,68,0.8)" />
                              <stop offset="100%" stopColor="rgba(239,68,68,0.2)" />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            tickFormatter={formatAxisCurrency}
                            domain={([dataMin, dataMax]: [number, number]) => [
                              Math.floor(Math.min(0, dataMin) * 1.1),
                              Math.ceil(Math.max(0, dataMax) * 1.2)
                            ]}
                          />
                          <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Cumulative P&L']} />
                          {/* Positive area (should be rare in losses cumulative but still supported) */}
                          <Area
                            type="monotone"
                            dataKey="pos"
                            stroke="none"
                            fill="url(#lossesGreenGradient)"
                            fillOpacity={0.7}
                            isAnimationActive={false}
                            baseValue={0}
                            connectNulls
                          />
                          {/* Negative area */}
                          <Area
                            type="monotone"
                            dataKey="neg"
                            stroke="none"
                            fill="url(#lossesRedGradient)"
                            fillOpacity={0.7}
                            isAnimationActive={false}
                            baseValue={0}
                            connectNulls
                          />
                          {/* Main stroke */}
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#2E22B9"
                            strokeWidth={2}
                            fill="transparent"
                            isAnimationActive={false}
                            connectNulls
                          />
                          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} ifOverflow="extendDomain" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                {/* Stats Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Wins Stats */}
                  <section className="bg-white dark:bg-[#171717] rounded-lg overflow-hidden">
                    <header className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Wins ({stats.meta.winsCount} Trades Matched)</h2>
                      </div>
                    </header>
                    <div className="px-6 py-4">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Statistics (Wins)</div>
                      <dl className="divide-y divide-gray-200 dark:divide-gray-800">
                        {stats.wins.map((row) => (
                          <div key={row.label} className="grid grid-cols-2 gap-4 py-2">
                            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">{row.label}</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-200 text-right">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </section>

                  {/* Losses Stats */}
                  <section className="bg-white dark:bg-[#171717] rounded-lg overflow-hidden">
                    <header className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Losses ({stats.meta.lossesCount} Trades Matched)</h2>
                      </div>
                    </header>
                    <div className="px-6 py-4">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Statistics (Losses)</div>
                      <dl className="divide-y divide-gray-200 dark:divide-gray-800">
                        {stats.losses.map((row) => (
                          <div key={row.label} className="grid grid-cols-2 gap-4 py-2">
                            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">{row.label}</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-200 text-right">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}