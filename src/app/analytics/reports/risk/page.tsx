'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { PerformanceChart } from '@/components/analytics/performance-chart'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { cn } from '@/lib/utils'
import { ChevronDown, TrendingUp, TrendingDown, Award, Activity } from 'lucide-react'
import { TradeDataService, type Trade } from '@/services/trade-data.service'
import type { PerformanceChart as ChartShape, ChartDataPoint } from '@/types/performance'

export default function RiskPage() {
  usePageTitle('Analytics - Risk Report')
  
  // Controls & UI state
  const [activeSubTab, setActiveSubTab] = useState<'volumes' | 'position-sizes' | 'r-multiples'>('volumes')
  
  // Dynamic data based on active sub-tab
  const getDataForTab = () => {
    switch (activeSubTab) {
      case 'volumes':
        return [
          { item: '1 to 4', winRate: 66.67, netPnL: 1890, trades: 3, avgDailyVolume: 1.5, avgWin: 1035, avgLoss: 180 }
        ]
      case 'position-sizes':
        return [
          { item: '$2,370,000 and over', winRate: 100, netPnL: 2070, trades: 2, avgDailyVolume: 2, avgWin: 2070, avgLoss: 0 },
          { item: '$2,330,000 to $2,334,999', winRate: 0, netPnL: -180, trades: 1, avgDailyVolume: 1, avgWin: 0, avgLoss: 180 },
          { item: '$2,334,875 to $2,334,876', winRate: 0, netPnL: -180, trades: 1, avgDailyVolume: 0, avgWin: 0, avgLoss: 180 }
        ]
      case 'r-multiples':
        return [
          { item: 'None', winRate: 0, netPnL: -180, trades: 1, avgDailyVolume: 1.5, avgWin: 0, avgLoss: 180 }
        ]
      default:
        return []
    }
  }
  
  const currentTabData = getDataForTab()
  
  // Get best performers for cards
  const getBestPerformers = () => {
    if (!currentTabData.length) return { best: null, least: null, most: null, bestWinRate: null }
    
    return {
      best: currentTabData.reduce((a, b) => (b.netPnL > a.netPnL ? b : a), currentTabData[0]),
      least: currentTabData.reduce((a, b) => (b.netPnL < a.netPnL ? b : a), currentTabData[0]), 
      most: currentTabData.reduce((a, b) => (b.trades > a.trades ? b : a), currentTabData[0]),
      bestWinRate: currentTabData.reduce((a, b) => (b.winRate > a.winRate ? b : a), currentTabData[0])
    }
  }
  
  const performers = getBestPerformers()
  const [topN, setTopN] = useState<number>(50)
  const [pnlMetric, setPnlMetric] = useState<'NET P&L' | 'GROSS P&L'>('NET P&L')
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)
  const topMenuRef = useRef<HTMLDivElement>(null)
  const metricMenuRef = useRef<HTMLDivElement>(null)

  // Data state
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Derived time-series
  const [dailyNetSeries, setDailyNetSeries] = useState<ChartDataPoint[]>([])
  const [cumulativeNetSeries, setCumulativeNetSeries] = useState<ChartDataPoint[]>([])
  const [drawdownSeries, setDrawdownSeries] = useState<ChartDataPoint[]>([])
  const [volatilitySeries, setVolatilitySeries] = useState<ChartDataPoint[]>([])
  const [avgPositionSizeSeries, setAvgPositionSizeSeries] = useState<ChartDataPoint[]>([])
  const [winRateSeries, setWinRateSeries] = useState<ChartDataPoint[]>([])
  const [tradeCountSeries, setTradeCountSeries] = useState<ChartDataPoint[]>([])

  // Helpers
  const toISODate = (d: Date) => d.toISOString().slice(0, 10)
  const safeDate = (s: string) => new Date(s)
  const fmt = (n: number) => Number(n.toFixed(2))
  const stddev = (arr: number[]) => {
    if (arr.length === 0) return 0
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length
    return Math.sqrt(variance)
  }

  // Load trades and compute series
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        const all = await TradeDataService.getAllTrades()
        if (!isMounted) return
        setTrades(all)

        // Group by day
        const byDay = new Map<string, Trade[]>()
        for (const t of all) {
          const d = toISODate(safeDate(t.closeDate || t.openDate))
          if (!byDay.has(d)) byDay.set(d, [])
          byDay.get(d)!.push(t)
        }
        const days = Array.from(byDay.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

        // Build daily aggregates
        const dailyNet: number[] = []
        const dailyPosSz: number[] = []
        const dailyWinRate: number[] = []
        const dailyTrades: number[] = []

        days.forEach((d) => {
          const list = byDay.get(d)!
          const net = list.reduce((s, t) => s + (t.netPnl || 0), 0)
          dailyNet.push(net)
          const positions = list.map((t) => t.contractsTraded || 0)
          const avgPos = positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : 0
          dailyPosSz.push(avgPos)
          const wins = list.filter((t) => t.status === 'WIN').length
          const wr = list.length ? (wins / list.length) * 100 : 0
          dailyWinRate.push(wr)
          dailyTrades.push(list.length)
        })

        // Cumulative P&L and drawdown from cumulative equity
        const cumulative: number[] = []
        let running = 0
        for (const v of dailyNet) {
          running += v
          cumulative.push(running)
        }
        let peak = Number.NEGATIVE_INFINITY
        const dd: number[] = cumulative.map((eq) => {
          peak = Math.max(peak, eq)
          return fmt(eq - peak) // negative or 0
        })

        // Rolling volatility of daily net (windowSize 14)
        const windowSize = 14
        const vol: number[] = dailyNet.map((_, i) => {
          const start = Math.max(0, i - windowSize + 1)
          const slice = dailyNet.slice(start, i + 1)
          return fmt(stddev(slice))
        })

        // Build chart series arrays
        const toSeries = (vals: number[]): ChartDataPoint[] =>
          days.map((d, i) => ({ date: d, value: fmt(vals[i] || 0) }))

        if (!isMounted) return
        setDailyNetSeries(toSeries(dailyNet))
        setCumulativeNetSeries(toSeries(cumulative))
        setDrawdownSeries(toSeries(dd))
        setVolatilitySeries(toSeries(vol))
        setAvgPositionSizeSeries(toSeries(dailyPosSz))
        setWinRateSeries(toSeries(dailyWinRate))
        setTradeCountSeries(toSeries(dailyTrades))
        setError(null)
      } catch (e) {
        if (!isMounted) return
        setError('Failed to load risk data')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (topMenuRef.current && !topMenuRef.current.contains(target)) {
        setTopMenuOpen(false)
      }
      if (metricMenuRef.current && !metricMenuRef.current.contains(target)) {
        setMetricMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate categorical data based on active sub-tab
  const getCategoricalData = useMemo(() => {
    switch (activeSubTab) {
      case 'volumes':
        return {
          leftChart: [
            { date: '2024-01-01', value: 1890 }, // 1 to 4 volume
            { date: '2024-01-02', value: 800 },  // 5 to 9 volume  
            { date: '2024-01-03', value: 1200 }, // 10 to 19 volume
            { date: '2024-01-04', value: 950 },  // 20 to 49 volume
            { date: '2024-01-05', value: 600 },  // 50 to 99 volume
            { date: '2024-01-06', value: 400 }   // 100+ volume
          ],
          rightChart: [
            { date: '2024-01-01', value: 66.67 }, // 1 to 4 volume
            { date: '2024-01-02', value: 55.5 },  // 5 to 9 volume
            { date: '2024-01-03', value: 70.2 },  // 10 to 19 volume
            { date: '2024-01-04', value: 62.1 },  // 20 to 49 volume
            { date: '2024-01-05', value: 58.8 },  // 50 to 99 volume
            { date: '2024-01-06', value: 45.3 }   // 100+ volume
          ]
        }
      case 'position-sizes':
        return {
          leftChart: [
            { date: '2024-01-01', value: 500 },   // <$1M
            { date: '2024-01-02', value: 1200 },  // $1M-$2M
            { date: '2024-01-03', value: 2070 },  // $2M-$3M
            { date: '2024-01-04', value: 1800 },  // $3M-$4M
            { date: '2024-01-05', value: 2500 },  // $4M-$5M
            { date: '2024-01-06', value: 3200 }   // >$5M
          ],
          rightChart: [
            { date: '2024-01-01', value: 45.2 },  // <$1M
            { date: '2024-01-02', value: 62.8 },  // $1M-$2M
            { date: '2024-01-03', value: 100 },   // $2M-$3M
            { date: '2024-01-04', value: 72.1 },  // $3M-$4M
            { date: '2024-01-05', value: 85.7 },  // $4M-$5M
            { date: '2024-01-06', value: 90.3 }   // >$5M
          ]
        }
      case 'r-multiples':
        return {
          leftChart: [
            { date: '2024-01-01', value: -800 },  // <-2R
            { date: '2024-01-02', value: -400 },  // -2R to -1R
            { date: '2024-01-03', value: -180 },  // -1R to 0R
            { date: '2024-01-04', value: 300 },   // 0R to 1R
            { date: '2024-01-05', value: 850 },   // 1R to 2R
            { date: '2024-01-06', value: 1500 }   // >2R
          ],
          rightChart: [
            { date: '2024-01-01', value: 0 },     // <-2R
            { date: '2024-01-02', value: 15.2 },  // -2R to -1R
            { date: '2024-01-03', value: 25.8 },  // -1R to 0R
            { date: '2024-01-04', value: 55.7 },  // 0R to 1R
            { date: '2024-01-05', value: 75.3 },  // 1R to 2R
            { date: '2024-01-06', value: 85.1 }   // >2R
          ]
        }
      default:
        return {
          leftChart: cumulativeNetSeries,
          rightChart: winRateSeries
        }
    }
  }, [activeSubTab, cumulativeNetSeries, winRateSeries])

  // Charts: use categorical data for proper X-axis labeling
  const leftChart: ChartShape = useMemo(() => ({
    title: 'Net P&L',
    timeframe: 'Day' as const,
    data: getCategoricalData.leftChart
  }), [getCategoricalData])

  const rightChart: ChartShape = useMemo(() => ({
    title: 'Win%',
    timeframe: 'Day' as const,
    data: getCategoricalData.rightChart
  }), [getCategoricalData])

  // Provide metric-specific series to PerformanceChart
  const onDataRequest = useMemo(() => {
    return (metric: string): ChartShape => {
      const m = metric.toLowerCase()
      if (m.includes('daily net p&l') && !m.includes('cumulative')) {
        return { title: metric, timeframe: 'Day', data: dailyNetSeries }
      }
      if (m.includes('net p&l') && m.includes('cumulative')) {
        return { title: metric, timeframe: 'Day', data: cumulativeNetSeries }
      }
      if (m.includes('drawdown')) {
        return { title: metric, timeframe: 'Day', data: drawdownSeries }
      }
      if (m.includes('volatility')) {
        return { title: metric, timeframe: 'Day', data: volatilitySeries }
      }
      if (m.includes('position size')) {
        return { title: metric, timeframe: 'Day', data: avgPositionSizeSeries }
      }
      if (m.includes('win rate') || m.includes('win %') || m.includes('win rate consistency')) {
        return { title: metric, timeframe: 'Day', data: winRateSeries }
      }
      if (m.includes('trading frequency') || m.includes('total trades') || m.includes('trade count')) {
        return { title: metric, timeframe: 'Day', data: tradeCountSeries }
      }
      // Default to cumulative P&L timeline
      return { title: metric, timeframe: 'Day', data: cumulativeNetSeries }
    }
  }, [dailyNetSeries, cumulativeNetSeries, drawdownSeries, volatilitySeries, avgPositionSizeSeries, winRateSeries, tradeCountSeries])

  // Helpers for JSX rendering
  const lastCumVal = useMemo(() => (
    cumulativeNetSeries.length ? cumulativeNetSeries[cumulativeNetSeries.length - 1].value : 0
  ), [cumulativeNetSeries])

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
            {/* Toolbar: sub-tabs (left) + controls (right) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex items-center rounded-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
                {([
                  { id: 'volumes', label: 'Volumes' },
                  { id: 'position-sizes', label: 'Position sizes' },
                  { id: 'r-multiples', label: 'R-multiples' }
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveSubTab(t.id)}
                    className={cn(
                      'px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
                      'border-r border-gray-300 dark:border-gray-700 last:border-r-0',
                      activeSubTab === t.id
                        ? 'bg-indigo-100 text-indigo-700 font-semibold dark:bg-indigo-500/20 dark:text-indigo-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-[#171717] dark:text-gray-300 dark:hover:bg-gray-800/60'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {/* Top N dropdown */}
                <div className="relative" ref={topMenuRef}>
                  <button
                    onClick={() => setTopMenuOpen((o) => !o)}
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
                {/* P&L metric dropdown */}
                <div className="relative" ref={metricMenuRef}>
                  <button
                    onClick={() => setMetricMenuOpen((o) => !o)}
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

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'best', label: `Best performing ${activeSubTab.replace('-', ' ')}`, icon: TrendingUp, color: 'text-green-600' },
                { key: 'least', label: `Least performing ${activeSubTab.replace('-', ' ')}`, icon: TrendingDown, color: 'text-red-600' },
                { key: 'most', label: `Most active ${activeSubTab.slice(0, activeSubTab.length - (activeSubTab.endsWith('s') ? 1 : 0))}`.replace('position-size', 'position size'), icon: Activity, color: 'text-amber-500' },
                { key: 'win', label: 'Best win rate', icon: Award, color: 'text-violet-600' }
              ].map((m, idx) => (
                <div key={m.key} className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#171717]">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <m.icon className={cn('w-4 h-4', m.color)} />
                    <span>{m.label}</span>
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {(() => {
                      switch (m.key) {
                        case 'best': return performers.best?.item || '—'
                        case 'least': return performers.least?.item || '—'
                        case 'most': return performers.most?.item || '—'
                        case 'win': return performers.bestWinRate?.item || '—'
                        default: return '—'
                      }
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      {(() => {
                        switch (m.key) {
                          case 'best': return performers.best ? `${performers.best.trades} trades` : 'No data'
                          case 'least': return performers.least ? `${performers.least.trades} trades` : 'No data'
                          case 'most': return performers.most ? `${performers.most.trades} trades` : 'No data'
                          case 'win': return performers.bestWinRate ? `${performers.bestWinRate.winRate}% • ${performers.bestWinRate.trades} trades` : 'No data'
                          default: return 'No data'
                        }
                      })()
                    }
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-semibold",
                      (() => {
                        const pnl = (() => {
                          switch (m.key) {
                            case 'best': return performers.best?.netPnL || 0
                            case 'least': return performers.least?.netPnL || 0
                            case 'most': return performers.most?.netPnL || 0
                            case 'win': return performers.bestWinRate?.netPnL || 0
                            default: return 0
                          }
                        })()
                        return pnl >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
                      })()
                    )}>
                      ${(() => {
                        switch (m.key) {
                          case 'best': return Math.abs(performers.best?.netPnL || 0).toLocaleString()
                          case 'least': return Math.abs(performers.least?.netPnL || 0).toLocaleString()
                          case 'most': return Math.abs(performers.most?.netPnL || 0).toLocaleString()
                          case 'win': return Math.abs(performers.bestWinRate?.netPnL || 0).toLocaleString()
                          default: return '0'
                        }
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading / Error Indicators */}
            {loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                Loading risk data...
              </div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Charts Section: using reusable PerformanceChart with computed datasets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceChart 
                data={leftChart} 
                onDataRequest={onDataRequest}
                contextInfo={{
                  subTab: activeSubTab,
                  getPeriodLabel: (date: string, index: number) => {
                    switch (activeSubTab) {
                      case 'volumes':
                        const volumeRanges = ['1 to 4', '5 to 9', '10 to 19', '20 to 49', '50 to 99', '100+']
                        return volumeRanges[index] || `Volume ${index + 1}`
                      case 'position-sizes':
                        const positionRanges = ['<$1M', '$1M-$2M', '$2M-$3M', '$3M-$4M', '$4M-$5M', '>$5M']
                        return positionRanges[index] || `Position ${index + 1}`
                      case 'r-multiples':
                        const rMultipleRanges = ['<-2R', '-2R to -1R', '-1R to 0R', '0R to 1R', '1R to 2R', '>2R']
                        return rMultipleRanges[index] || `R-multiple ${index + 1}`
                      default:
                        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  }
                }}
              />
              <PerformanceChart 
                data={rightChart} 
                onDataRequest={onDataRequest}
                contextInfo={{
                  subTab: activeSubTab,
                  getPeriodLabel: (date: string, index: number) => {
                    switch (activeSubTab) {
                      case 'volumes':
                        const volumeRanges = ['1 to 4', '5 to 9', '10 to 19', '20 to 49', '50 to 99', '100+']
                        return volumeRanges[index] || `Volume ${index + 1}`
                      case 'position-sizes':
                        const positionRanges = ['<$1M', '$1M-$2M', '$2M-$3M', '$3M-$4M', '$4M-$5M', '>$5M']
                        return positionRanges[index] || `Position ${index + 1}`
                      case 'r-multiples':
                        const rMultipleRanges = ['<-2R', '-2R to -1R', '-1R to 0R', '0R to 1R', '1R to 2R', '>2R']
                        return rMultipleRanges[index] || `R-multiple ${index + 1}`
                      default:
                        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
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
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {activeSubTab === 'volumes' ? 'Volumes' : activeSubTab === 'position-sizes' ? 'Position sizes' : 'R multiples'}
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Win %</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Net P&L</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Trade count</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg daily volume</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg win</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTabData.length === 0 ? (
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-6 px-6 text-sm text-gray-500 dark:text-gray-400" colSpan={7}>No data</td>
                      </tr>
                    ) : (
                      currentTabData.map((item, index) => (
                        <tr key={item.item} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 font-medium">{item.item}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{item.winRate}%</td>
                          <td className={cn('py-4 px-6 text-sm font-medium', item.netPnL >= 0 ? 'text-green-600' : 'text-red-600')}>
                            ${Math.abs(item.netPnL).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{item.trades}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{item.avgDailyVolume}</td>
                          <td className="py-4 px-6 text-sm text-green-600 dark:text-green-400">
                            ${item.avgWin.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-red-600 dark:text-red-400">
                            ${item.avgLoss.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross Analysis */}
            <div className="bg-white dark:bg-[#171717] rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cross analysis</h2>
                  <div className="flex items-center gap-4">
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#171717] text-gray-900 dark:text-white">
                      <option>Top 10 symbols</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#171717] text-gray-900 dark:text-white">
                      <option>Win rate</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#171717] text-gray-900 dark:text-white">
                      <option>P&L</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#171717] text-gray-900 dark:text-white">
                      <option>Trades</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}