'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { PerformanceChart } from '@/components/analytics/performance-chart'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { cn } from '@/lib/utils'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAnalytics } from '@/hooks/use-analytics'
import type { Trade } from '@/services/trade-data.service'
import type { PerformanceChart as ChartShape, ChartDataPoint } from '@/types/performance'
import { DataStore } from '@/services/data-store.service'

export default function TagsPage() {
  usePageTitle('Analytics - Tags Report')

  // Controls & UI state
  const [topN, setTopN] = useState<number>(10)
  const [pnlMetric, setPnlMetric] = useState<'NET P&L' | 'GROSS P&L'>('NET P&L')
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)
  const topMenuRef = useRef<HTMLDivElement>(null)
  const metricMenuRef = useRef<HTMLDivElement>(null)

  // Data state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Derived time-series (aggregated across all tags by day)
  const [dailyNetSeries, setDailyNetSeries] = useState<ChartDataPoint[]>([])
  const [cumulativeNetSeries, setCumulativeNetSeries] = useState<ChartDataPoint[]>([])
  const [drawdownSeries, setDrawdownSeries] = useState<ChartDataPoint[]>([])
  const [winRateSeries, setWinRateSeries] = useState<ChartDataPoint[]>([])
  const [tradeCountSeries, setTradeCountSeries] = useState<ChartDataPoint[]>([])
  const [maxLosingStreakSeries, setMaxLosingStreakSeries] = useState<ChartDataPoint[]>([])

  // Grouped by tag for summary
  type TagRow = {
    tag: string
    winRate: number
    netPnl: number
    tradeCount: number
    avgDailyVolume: number
    avgWin: number
    avgLoss: number
  }
  const [summaryRows, setSummaryRows] = useState<TagRow[]>([])

  // Helpers
  const toISODate = (d: Date) => d.toISOString().slice(0, 10)
  const safeDate = (s: string) => new Date(s)
  const fmt = (n: number) => Number(n.toFixed(2))

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        const all = DataStore.getAllTrades()
        if (!isMounted) return

        // Group by day (all tags)
        const byDay = new Map<string, Trade[]>()
        for (const t of all) {
          const d = toISODate(safeDate(t.closeDate || t.openDate))
          if (!byDay.has(d)) byDay.set(d, [])
          byDay.get(d)!.push(t)
        }
        const days = Array.from(byDay.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

        // Daily aggregates
        const dailyNet: number[] = []
        const dailyTrades: number[] = []
        const dailyWinRate: number[] = []
        days.forEach((d) => {
          const list = byDay.get(d)!
          const net = list.reduce((s, t) => s + (t.netPnl || 0), 0)
          dailyNet.push(net)
          dailyTrades.push(list.length)
          const wins = list.filter((t) => t.status === 'WIN').length
          dailyWinRate.push(list.length ? (wins / list.length) * 100 : 0)
        })

        // Cumulative equity and drawdown
        const cumulative: number[] = []
        let running = 0
        for (const v of dailyNet) {
          running += v
          cumulative.push(running)
        }
        let peak = Number.NEGATIVE_INFINITY
        const dd: number[] = cumulative.map((eq) => {
          peak = Math.max(peak, eq)
          return fmt(eq - peak)
        })

        // Losing streak by days (based on daily net < 0)
        let streak = 0
        let maxSoFar = 0
        const maxStreakByDay: number[] = dailyNet.map((v) => {
          if (v < 0) {
            streak += 1
          } else {
            streak = 0
          }
          maxSoFar = Math.max(maxSoFar, streak)
          return maxSoFar
        })

        // Build series helpers
        const toSeries = (vals: number[]): ChartDataPoint[] =>
          days.map((d, i) => ({ date: d, value: fmt(vals[i] || 0) }))

        if (!isMounted) return
        setDailyNetSeries(toSeries(dailyNet))
        setCumulativeNetSeries(toSeries(cumulative))
        setDrawdownSeries(toSeries(dd))
        setWinRateSeries(toSeries(dailyWinRate))
        setTradeCountSeries(toSeries(dailyTrades))
        setMaxLosingStreakSeries(toSeries(maxStreakByDay))

        // Summary rows by tag (trade can contribute to multiple tags)
        const byTag = new Map<string, Trade[]>()
        for (const t of all) {
          const tags = t.tags && t.tags.length ? t.tags : ['None']
          for (const tag of tags) {
            if (!byTag.has(tag)) byTag.set(tag, [])
            byTag.get(tag)!.push(t)
          }
        }

        const rows: TagRow[] = Array.from(byTag.entries()).map(([tag, list]) => {
          const total = list.length
          const wins = list.filter((t) => t.status === 'WIN')
          const losses = list.filter((t) => t.status === 'LOSS')
          const winRate = total ? (wins.length / total) * 100 : 0
          const netPnl = list.reduce((s, t) => s + (t.netPnl || 0), 0)
          const avgWin = wins.length ? wins.reduce((a, t) => a + (t.netPnl || 0), 0) / wins.length : 0
          const avgLoss = losses.length ? Math.abs(losses.reduce((a, t) => a + (t.netPnl || 0), 0)) / losses.length : 0

          // Avg daily volume for this tag (sum contracts per day across tagged trades)
          const dayMap = new Map<string, number>()
          for (const t of list) {
            const d = toISODate(safeDate(t.closeDate || t.openDate))
            const vol = t.contractsTraded || 0
            dayMap.set(d, (dayMap.get(d) || 0) + vol)
          }
          const avgDailyVolume = dayMap.size ? Array.from(dayMap.values()).reduce((a, b) => a + b, 0) / dayMap.size : 0

          return { tag, winRate, netPnl, tradeCount: total, avgDailyVolume, avgWin, avgLoss }
        })

        // Sort by Net P&L desc and keep Top N
        rows.sort((a, b) => b.netPnl - a.netPnl)
        setSummaryRows(rows)

        setError(null)
      } catch {
        if (!isMounted) return
        setError('Failed to load tags data')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (topMenuRef.current && !topMenuRef.current.contains(target)) setTopMenuOpen(false)
      if (metricMenuRef.current && !metricMenuRef.current.contains(target)) setMetricMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Charts
  const leftChart: ChartShape = useMemo(() => ({
    title: 'Avg daily net drawdown',
    timeframe: 'Day' as const,
    data: drawdownSeries
  }), [drawdownSeries])

  const rightChart: ChartShape = useMemo(() => ({
    title: 'Win %',
    timeframe: 'Day' as const,
    data: winRateSeries
  }), [winRateSeries])

  // Data provider for PerformanceChart
  const onDataRequest = useMemo(() => {
    return (metric: string): ChartShape => {
      const m = metric.toLowerCase()
      if (m.includes('avg daily net drawdown') || m.includes('drawdown')) {
        return { title: metric, timeframe: 'Day', data: drawdownSeries }
      }
      if (m.includes('win %') || m.includes('win rate')) {
        return { title: metric, timeframe: 'Day', data: winRateSeries }
      }
      if (m.includes('total trades')) {
        return { title: metric, timeframe: 'Day', data: tradeCountSeries }
      }
      if (m.includes('max consecutive losing')) {
        return { title: metric, timeframe: 'Day', data: maxLosingStreakSeries }
      }
      if (m.includes('trade count') || m.includes('trading frequency')) {
        return { title: metric, timeframe: 'Day', data: tradeCountSeries }
      }
      if (m.includes('daily net p&l') && !m.includes('cumulative')) {
        return { title: metric, timeframe: 'Day', data: dailyNetSeries }
      }
      if (m.includes('net p&l') && m.includes('cumulative')) {
        return { title: metric, timeframe: 'Day', data: cumulativeNetSeries }
      }
      // Fallback
      return { title: metric, timeframe: 'Day', data: dailyNetSeries }
    }
  }, [drawdownSeries, winRateSeries, maxLosingStreakSeries, tradeCountSeries, dailyNetSeries, cumulativeNetSeries])

  // Helpers for UI
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
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tags</div>
              <div className="flex items-center gap-2">
                {/* Top N */}
                <div className="relative" ref={topMenuRef}>
                  <button
                    onClick={() => setTopMenuOpen(o => !o)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[120px] justify-between"
                    aria-label="Select Top N"
                    aria-expanded={topMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>Top {topN}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", topMenuOpen && "rotate-180")} />
                  </button>
                  {topMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[140px] overflow-hidden z-50">
                      {[5, 10, 20, 50].map((n) => (
                        <button
                          key={n}
                          onClick={() => { setTopN(n); setTopMenuOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                          role="option"
                          aria-selected={topN === n}
                        >
                          Top {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
            </div>

            {/* Loading / Error Indicators */}
            {loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Loading tags data...</div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceChart 
                data={leftChart} 
                onDataRequest={onDataRequest}
                contextInfo={{
                  getPeriodLabel: (date: string) => {
                    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                }}
              />
              <PerformanceChart 
                data={rightChart} 
                onDataRequest={onDataRequest}
                contextInfo={{
                  getPeriodLabel: (date: string) => {
                    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                }}
              />
            </div>

            {/* Summary Table */}
            <div className="bg-white dark:bg-[#171717] rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Tag</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Win %</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Net P&L</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Trade count</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg daily volume</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg win</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.length === 0 ? (
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-6 px-6 text-sm text-gray-500 dark:text-gray-400" colSpan={7}>No data</td>
                      </tr>
                    ) : (
                      summaryRows.slice(0, topN).map((row) => (
                        <tr key={row.tag} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{row.tag}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{row.winRate.toFixed(2)}%</td>
                          <td className={cn('py-4 px-6 text-sm font-medium', row.netPnl >= 0 ? 'text-green-600' : 'text-red-600')}>${Math.abs(row.netPnl).toLocaleString()}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{row.tradeCount}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{row.avgDailyVolume.toFixed(2)}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">${Math.abs(row.avgWin).toFixed(2)}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">${Math.abs(row.avgLoss).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}