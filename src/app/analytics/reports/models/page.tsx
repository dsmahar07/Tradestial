'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { OptimizedPerformanceChart } from '@/components/analytics/optimized-performance-chart'
import { AnalyticsCard } from '@/components/ui/analytics-card'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { cn } from '@/lib/utils'
import { TradeDataService } from '@/services/trade-data.service'
import type { Trade } from '@/services/trade-data.service'
import type { PerformanceChart as ChartShape, ChartDataPoint } from '@/types/performance'
import TradeMetadataService from '@/services/trade-metadata.service'
import { BestPerformingIcon, LeastPerformingIcon, BestActiveIcon, BestWinRateIcon } from '@/components/ui/custom-icons'

export default function ModelsPage() {
  usePageTitle('Analytics - Models Report')

  // Controls & UI state
  const [topN, setTopN] = useState<number>(10)
  const [pnlMetric, setPnlMetric] = useState<'NET P&L' | 'GROSS P&L'>('NET P&L')
  const [selectedModel, setSelectedModel] = useState<string>('All Models')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Type definitions
  type CrossDimension = 'Account' | 'Tag' | 'Symbols' | 'Top 10 Symbols' | 'Bottom Top 10 Symbols' | 'Entry Price' | 'Exit Price' | 'Instrument' | 'Day of Week' | 'Month' | 'Trade Duration' | 'Year' | 'Entry Time (15m)' | 'Entry Time (30m)' | 'Entry Time (5m)' | 'Entry Time (Hourly)' | 'Exit Time (15m)' | 'Exit Time (30m)' | 'Exit Time (5m)' | 'Exit Time (Hourly)' | 'Position Size' | 'R-Multiple' | 'Volume'
  type CrossMetric = 'Win rate' | 'P&L' | 'Trades'

  // Cross Analysis state
  const [crossDimension, setCrossDimension] = useState<CrossDimension>('Symbols')
  const [scopeTop, setScopeTop] = useState<'Top' | 'Bottom'>('Top')
  const [crossMetric, setCrossMetric] = useState<CrossMetric>('Win rate')

  // Dropdown state (only for remaining custom dropdowns)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)

  // Refs for outside click detection (only for remaining custom dropdowns)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const topMenuRef = useRef<HTMLDivElement>(null)
  const metricMenuRef = useRef<HTMLDivElement>(null)

  // Series state
  const [dailyNetSeries, setDailyNetSeries] = useState<ChartDataPoint[]>([])
  const [cumulativeNetSeries, setCumulativeNetSeries] = useState<ChartDataPoint[]>([])
  const [drawdownSeries, setDrawdownSeries] = useState<ChartDataPoint[]>([])
  const [winRateSeries, setWinRateSeries] = useState<ChartDataPoint[]>([])
  const [tradeCountSeries, setTradeCountSeries] = useState<ChartDataPoint[]>([])
  const [maxLosingStreakSeries, setMaxLosingStreakSeries] = useState<ChartDataPoint[]>([])
  const [summaryRows, setSummaryRows] = useState<ModelRow[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [metaVersion, setMetaVersion] = useState<number>(0)
  const [featuredCards, setFeaturedCards] = useState<Array<{ title: string; model: string; meta: string }>>([])
  const [mappedAll, setMappedAll] = useState<any[]>([])

  // Calculate models data from real trades
  type ModelRow = {
    model: string
    winRate: number
    netPnl: number
    tradeCount: number
    avgDailyVolume: number
    avgWin: number
    avgLoss: number
  }

  // summaryRows and series are built in the effect below

  // Helpers
  const toISODate = (d: Date) => d.toISOString().slice(0, 10)
  const safeDate = (s: string) => new Date(s)
  const fmt = (n: number) => Number(n.toFixed(2))

  // Refresh when trade metadata changes (e.g., models assigned)
  useEffect(() => {
    const unsubscribe = TradeMetadataService.subscribe(() => {
      setMetaVersion(v => v + 1)
    })
    return () => { try { unsubscribe() } catch {} }
  }, [])

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        const all = await TradeDataService.getAllTrades()
        if (!isMounted) return
        // proceed with in-effect processing only

        // Merge in model selections from TradeMetadataService if available
        let mappedAll: Trade[] = all
        try {
          const metaMap = TradeMetadataService.getAllTradeMetadata()
          mappedAll = all.map((t) => {
            const meta = metaMap?.[t.id]
            const modelFromMeta = typeof meta?.model === 'string' && meta.model.trim() !== '' ? meta.model.trim() : undefined
            return { ...t, model: modelFromMeta ?? t.model }
          })
        } catch {
          // ignore metadata errors and use original trades
          mappedAll = all
        }

        // Get available models for dropdown (from mapped trades)
        const modelSet = new Set<string>()
        for (const t of mappedAll) {
          const model = t.model || 'None'
          if (model !== 'None') modelSet.add(model)
        }
        const models = Array.from(modelSet).sort()
        setAvailableModels(models)
        setMappedAll(mappedAll)
        setAvailableModels(models)

        // Filter trades by selected model
        const filteredTrades = selectedModel === 'All Models'
          ? mappedAll
          : mappedAll.filter(t => (t.model || 'None') === selectedModel)

        // Group by day (filtered by model)
        const byDay = new Map<string, Trade[]>()
        for (const t of filteredTrades) {
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
          return fmt(eq - peak) // negative or 0
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

        // Summary rows by model (filtered by selected model)
        const byModel = new Map<string, Trade[]>()
        const tradesForSummary = selectedModel === 'All Models' ? mappedAll : filteredTrades
        for (const t of tradesForSummary) {
          const key = t.model || 'None'
          if (!byModel.has(key)) byModel.set(key, [])
          byModel.get(key)!.push(t)
        }

        const rows: ModelRow[] = Array.from(byModel.entries()).map(([pb, list]) => {
          const total = list.length
          const wins = list.filter((t) => t.status === 'WIN')
          const losses = list.filter((t) => t.status === 'LOSS')
          const winRate = total ? (wins.length / total) * 100 : 0
          const netPnl = list.reduce((s, t) => s + (t.netPnl || 0), 0)
          const avgWin = wins.length ? wins.reduce((a, t) => a + (t.netPnl || 0), 0) / wins.length : 0
          const avgLoss = losses.length ? Math.abs(losses.reduce((a, t) => a + (t.netPnl || 0), 0)) / losses.length : 0

          // Avg daily volume within this model
          const dayMap = new Map<string, number>()
          for (const t of list) {
            const d = toISODate(safeDate(t.closeDate || t.openDate))
            const vol = t.contractsTraded || 0
            dayMap.set(d, (dayMap.get(d) || 0) + vol)
          }
          const avgDailyVolume = dayMap.size ? Array.from(dayMap.values()).reduce((a, b) => a + b, 0) / dayMap.size : 0

          return { model: pb, winRate, netPnl, tradeCount: total, avgDailyVolume, avgWin, avgLoss }
        })

        // Sort by Net P&L desc
        rows.sort((a, b) => b.netPnl - a.netPnl)
        setSummaryRows(rows)

        // Build featured KPI cards from ALL models (ignore current filter)
        const byModelAll = new Map<string, Trade[]>()
        for (const t of mappedAll) {
          const key = t.model || 'None'
          if (!byModelAll.has(key)) byModelAll.set(key, [])
          byModelAll.get(key)!.push(t)
        }
        const rowsAll: ModelRow[] = Array.from(byModelAll.entries()).map(([pb, list]) => {
          const total = list.length
          const wins = list.filter((t) => t.status === 'WIN')
          const losses = list.filter((t) => t.status === 'LOSS')
          const winRate = total ? (wins.length / total) * 100 : 0
          const netPnl = list.reduce((s, t) => s + (t.netPnl || 0), 0)
          const avgWin = wins.length ? wins.reduce((a, t) => a + (t.netPnl || 0), 0) / wins.length : 0
          const avgLoss = losses.length ? Math.abs(losses.reduce((a, t) => a + (t.netPnl || 0), 0)) / losses.length : 0
          // Avg daily volume not needed for cards
          return { model: pb, winRate, netPnl, tradeCount: total, avgDailyVolume: 0, avgWin, avgLoss }
        })

        if (rowsAll.length > 0) {
          const bestPerforming = [...rowsAll].sort((a, b) => b.netPnl - a.netPnl)[0]
          const leastPerforming = [...rowsAll].sort((a, b) => a.netPnl - b.netPnl)[0]
          const bestActive = [...rowsAll].sort((a, b) => b.tradeCount - a.tradeCount)[0]
          const bestWinRate = [...rowsAll].sort((a, b) => b.winRate - a.winRate)[0]

          const fmtCurrency = (n: number) => {
            const sign = n < 0 ? '-' : ''
            const absolute = Math.abs(n)
            return `${sign}$${absolute.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }

          setFeaturedCards([
            { title: 'Best performing playbook', model: bestPerforming.model, meta: `${bestPerforming.tradeCount} trades • ${fmtCurrency(bestPerforming.netPnl)}` },
            { title: 'Least performing playbook', model: leastPerforming.model, meta: `${leastPerforming.tradeCount} trades • ${fmtCurrency(leastPerforming.netPnl)}` },
            { title: 'Best active playbook', model: bestActive.model, meta: `${bestActive.tradeCount} trades` },
            { title: 'Best win rate', model: bestWinRate.model, meta: `${bestWinRate.winRate.toFixed(2)}% • ${bestWinRate.tradeCount} trades` },
          ])
        } else {
          setFeaturedCards([])
        }

        setError(null)
      } catch {
        if (!isMounted) return
        setError('Failed to load models data')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [selectedModel, metaVersion])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) setModelMenuOpen(false)
      if (topMenuRef.current && !topMenuRef.current.contains(event.target as Node)) setTopMenuOpen(false)
      if (metricMenuRef.current && !metricMenuRef.current.contains(event.target as Node)) setMetricMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Charts
  const leftChart: ChartShape = useMemo(() => ({
    title: selectedModel === 'All Models' ? 'Avg daily net drawdown (All Models)' : `Avg daily net drawdown (${selectedModel})`,
    timeframe: 'Day' as const,
    data: drawdownSeries
  }), [drawdownSeries, selectedModel])

  const rightChart: ChartShape = useMemo(() => ({
    title: selectedModel === 'All Models' ? 'Win % (All Models)' : `Win % (${selectedModel})`,
    timeframe: 'Day' as const,
    data: winRateSeries
  }), [winRateSeries, selectedModel])

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
      // Fallback to daily net series for unmatched metrics
      return { title: metric, timeframe: 'Day', data: dailyNetSeries }
    }
  }, [drawdownSeries, winRateSeries, maxLosingStreakSeries, tradeCountSeries, dailyNetSeries, cumulativeNetSeries])

  // Helpers for UI
  const handleTabChange = (tabId: string) => { console.log('Active tab:', tabId) }
  const handleDropdownItemClick = (tabId: string, itemId: string) => { console.log(`Selected ${itemId} from ${tabId} tab`) }

  // no-op

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#0f0f0f]">
          <AnalyticsTabNavigation 
            tabs={analyticsNavigationConfig.map(tab => ({
              ...tab,
              isActive: tab.id === 'reports'
            }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
          <div className="w-full space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Models</div>
              <div className="flex items-center gap-2">
                {/* Model Selection */}
                <div className="relative" ref={modelMenuRef}>
                  <button
                    onClick={() => setModelMenuOpen(o => !o)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[160px] justify-between"
                    aria-label="Select Model"
                    aria-expanded={modelMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>{selectedModel}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", modelMenuOpen && "rotate-180")} />
                  </button>
                  {modelMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[180px] overflow-hidden z-50 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => { setSelectedModel('All Models'); setModelMenuOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                        role="option"
                        aria-selected={selectedModel === 'All Models'}
                      >
                        All Models
                      </button>
                      {availableModels.map((model) => (
                        <button
                          key={model}
                          onClick={() => { setSelectedModel(model); setModelMenuOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                          role="option"
                          aria-selected={selectedModel === model}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Top N */}
                <div className="relative" ref={topMenuRef}>
                  <button
                    onClick={() => setTopMenuOpen(o => !o)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[120px] justify-between"
                    aria-label="Select Top N"
                    aria-expanded={topMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>Top {topN}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", topMenuOpen && "rotate-180")} />
                  </button>
                  {topMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[140px] overflow-hidden z-50">
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
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[140px] justify-between"
                    aria-label="Select P&L metric"
                    aria-expanded={metricMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>{pnlMetric}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", metricMenuOpen && "rotate-180")} />
                  </button>
                  {metricMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[160px] overflow-hidden z-50">
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
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}

            {/* Featured KPI Cards */}
            {featuredCards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredCards.map((card, idx) => {
                  const cardConfigs = [
                    { icon: BestPerformingIcon, color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.12)' },
                    { icon: LeastPerformingIcon, color: '#FB3748', bgColor: 'rgba(251, 55, 72, 0.12)' },
                    { icon: BestActiveIcon, color: '#693EE0', bgColor: 'rgba(105, 62, 224, 0.12)' },
                    { icon: BestWinRateIcon, color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.12)' }
                  ]
                  const config = cardConfigs[idx] || cardConfigs[0]
                  
                  // Determine background color based on actual P&L performance
                  const getPerformanceBg = () => {
                    // Extract P&L value from card.meta (e.g., "4 trades • $2,500")
                    const pnlMatch = card.meta.match(/\$(-?\d+(?:,\d{3})*(?:\.\d{2})?)/);
                    if (pnlMatch) {
                      const pnlValue = parseFloat(pnlMatch[1].replace(/,/g, ''));
                      if (pnlValue > 0) {
                        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      } else if (pnlValue < 0) {
                        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }
                    }
                    
                    // For cards without P&L (like "Most active"), use neutral blue
                    if (idx === 2) {
                      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    }
                    
                    // Default to neutral gray
                    return "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                  }
                  
                  return (
                    <AnalyticsCard
                      key={card.title}
                      title={card.title}
                      value={card.model || '—'}
                      change={0}
                      changeLabel=""
                      icon={config.icon}
                      iconColor={config.color}
                      delay={idx * 0.1}
                      className="h-full"
                      showCustomContent={true}
                      customContent={
                        <div className={`absolute bottom-4 right-4 text-xs text-right px-2 py-1 rounded-md ${getPerformanceBg()}`}>
                          {card.meta}
                        </div>
                      }
                    />
                  )
                })}
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OptimizedPerformanceChart 
                data={leftChart} 
                onDataRequest={onDataRequest}
                contextInfo={{
                  getPeriodLabel: (date: string) => {
                    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  },
                  modelName: selectedModel
                }}
              />
              <OptimizedPerformanceChart 
                data={rightChart} 
                onDataRequest={onDataRequest}
                contextInfo={{
                  getPeriodLabel: (date: string) => {
                    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  },
                  modelName: selectedModel
                }}
              />
            </div>

            {/* Summary Table */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Models</th>
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
                      summaryRows.map((row) => (
                        <tr key={row.model} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{row.model}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{row.winRate.toFixed(2)}%</td>
                          <td className={cn('py-4 px-6 text-sm font-semibold', row.netPnl >= 0 ? 'text-[#10B981] dark:text-[#10B981]' : 'text-rose-600 dark:text-rose-400')}>${Math.abs(row.netPnl).toLocaleString()}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{row.tradeCount}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{row.avgDailyVolume.toFixed(2)}</td>
                          <td className="py-4 px-6 text-sm text-[#10B981] dark:text-[#10B981]">${Math.abs(row.avgWin).toFixed(2)}</td>
                          <td className="py-4 px-6 text-sm text-rose-600 dark:text-rose-400">${Math.abs(row.avgLoss).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross analysis */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cross analysis</h2>
                  <div className="flex items-center gap-4">
                    {/* Dimension dropdown */}
                    <Select.Root value={crossDimension} onValueChange={(value) => setCrossDimension(value as CrossDimension)}>
                      <Select.Trigger className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm rounded-md transition-all duration-200 min-w-[200px] justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <Select.Value>{crossDimension}</Select.Value>
                        <Select.Icon>
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[100] min-w-[260px] max-h-[400px] overflow-auto">
                          <Select.Viewport className="p-1">
                            <Select.Group>
                              <Select.Label className="px-3 py-1 text-[11px] uppercase tracking-wide font-bold text-gray-900 dark:text-white">Account & Tags</Select.Label>
                              <Select.Item value="Account" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Account</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Tag" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Tag</Select.ItemText>
                              </Select.Item>
                            </Select.Group>
                            <Select.Group>
                              <Select.Label className="px-3 py-1 text-[11px] uppercase tracking-wide font-bold text-gray-900 dark:text-white">Symbols</Select.Label>
                              <Select.Item value="Symbols" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Symbols</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Top 10 Symbols" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Top 10 Symbols</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Bottom Top 10 Symbols" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Bottom Top 10 Symbols</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Entry Price" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Entry Price</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Exit Price" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Exit Price</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Instrument" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Instrument</Select.ItemText>
                              </Select.Item>
                            </Select.Group>
                            <Select.Group>
                              <Select.Label className="px-3 py-1 text-[11px] uppercase tracking-wide font-bold text-gray-900 dark:text-white">Day and Time</Select.Label>
                              <Select.Item value="Day of Week" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Day of Week</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Month" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Month</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Trade Duration" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Trade Duration</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Year" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Year</Select.ItemText>
                              </Select.Item>
                            </Select.Group>
                            <Select.Group>
                              <Select.Label className="px-3 py-1 text-[11px] uppercase tracking-wide font-bold text-gray-900 dark:text-white">Entry Time By</Select.Label>
                              <Select.Item value="Entry Time (15m)" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Entry Time by 15 minutes</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Entry Time (30m)" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Entry Time by 30 minutes</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Entry Time (5m)" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Entry Time by 5 minutes</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Entry Time (Hourly)" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Entry Time by hours</Select.ItemText>
                              </Select.Item>
                            </Select.Group>
                            <Select.Group>
                              <Select.Label className="px-3 py-1 text-[11px] uppercase tracking-wide font-bold text-gray-900 dark:text-white">Exit Time By</Select.Label>
                              <Select.Item value="Exit Time (15m)" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Exit Time by 15 minutes</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Exit Time (30m)" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Exit Time by 30 minutes</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Exit Time (5m)" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Exit Time by 5 minutes</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Exit Time (Hourly)" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Exit Time by hours</Select.ItemText>
                              </Select.Item>
                            </Select.Group>
                            <Select.Group>
                              <Select.Label className="px-3 py-1 text-[11px] uppercase tracking-wide font-bold text-gray-900 dark:text-white">Risk & Size</Select.Label>
                              <Select.Item value="Position Size" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Position Size</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="R-Multiple" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>R-Multiple</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Volume" className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Volume</Select.ItemText>
                              </Select.Item>
                            </Select.Group>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>

                    {/* Scope dropdown (Top/Bottom N) */}
                    <div className="flex items-center gap-2">
                      <Select.Root value={scopeTop} onValueChange={(value) => setScopeTop(value as 'Top' | 'Bottom')}>
                        <Select.Trigger className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm rounded-md transition-all duration-200 min-w-[80px] justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <Select.Value>{scopeTop}</Select.Value>
                          <Select.Icon>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[100] min-w-[100px]">
                            <Select.Viewport className="p-1">
                              <Select.Item value="Top" className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Top</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="Bottom" className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>Bottom</Select.ItemText>
                              </Select.Item>
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                      <Select.Root value={String(topN)} onValueChange={(value) => setTopN(parseInt(value))}>
                        <Select.Trigger className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm rounded-md transition-all duration-200 min-w-[70px] justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <Select.Value>{topN}</Select.Value>
                          <Select.Icon>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[100] min-w-[80px]">
                            <Select.Viewport className="p-1">
                              {[5, 10, 20, 50].map((n) => (
                                <Select.Item key={n} value={String(n)} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                  <Select.ItemText>{n}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>

                    {/* Metric dropdown */}
                    <Select.Root value={crossMetric} onValueChange={(value) => setCrossMetric(value as CrossMetric)}>
                      <Select.Trigger className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm rounded-md transition-all duration-200 min-w-[140px] justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <Select.Value>{crossMetric}</Select.Value>
                        <Select.Icon>
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[100] min-w-[160px]">
                          <Select.Viewport className="p-1">
                            {(['Win rate', 'P&L', 'Trades'] as CrossMetric[]).map((m) => (
                              <Select.Item key={m} value={m} className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                <Select.ItemText>{m}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {availableModels.length > 0 ? (
                  <div className="space-y-4">
                    {/* Cross Analysis Table - dynamic dimensions */}
                    {availableModels.length > 0 && availableModels.map((model) => {
                      const modelTrades = mappedAll.filter((trade: any) => trade.model === model)
                      if (modelTrades.length === 0) return null

                      // Helpers for grouping
                      const getDayOfWeek = (dateStr: string) => {
                        const d = new Date(dateStr)
                        return d.toLocaleDateString('en-US', { weekday: 'short' })
                      }
                      const getMonth = (dateStr: string) => {
                        const d = new Date(dateStr)
                        return d.toLocaleDateString('en-US', { month: 'short' })
                      }
                      const getYear = (dateStr: string) => new Date(dateStr).getFullYear().toString()
                      const bucketTime = (time: string | undefined, interval: number) => {
                        if (!time) return 'Unknown'
                        const [hStr, mStr] = time.split(':')
                        const h = parseInt(hStr || '0', 10)
                        const m = parseInt(mStr || '0', 10)
                        const total = h * 60 + m
                        const bucketStart = Math.floor(total / interval) * interval
                        const bucketEnd = bucketStart + interval
                        const fmt = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
                        return `${fmt(bucketStart)}-${fmt(bucketEnd)}`
                      }
                      const bucketNumber = (val: number | undefined, step: number, label: string) => {
                        const v = typeof val === 'number' && isFinite(val) ? val : 0
                        const start = Math.floor(v / step) * step
                        const end = start + step
                        return `${label} ${start}-${end}`
                      }

                      // Dimension accessor returns one or more keys per trade
                      const getKeysForTrade = (t: any): string[] => {
                        switch (crossDimension) {
                          case 'Symbols':
                            return [t.symbol || 'Unknown']
                          case 'Account':
                            return [t.accountName || 'Unknown']
                          case 'Tag': {
                            const tags: string[] = Array.isArray(t.tags) ? t.tags : (Array.isArray(t.customTags) ? t.customTags : [])
                            return tags.length ? tags : ['Untagged']
                          }
                          case 'Instrument':
                            return [t.instrument || t.instrumentType || 'Unknown']
                          case 'Day of Week':
                            return [getDayOfWeek(t.openDate || t.closeDate)]
                          case 'Month':
                            return [getMonth(t.openDate || t.closeDate)]
                          case 'Year':
                            return [getYear(t.openDate || t.closeDate)]
                          case 'Trade Duration': {
                            // Expect duration in minutes via calculateTradeDuration in metrics path; compute quick here
                            const start = new Date(`${t.openDate} ${t.entryTime || '00:00:00'}`)
                            const end = new Date(`${t.closeDate || t.openDate} ${t.exitTime || t.entryTime || '00:00:00'}`)
                            const mins = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
                            if (!isFinite(mins)) return ['Unknown']
                            if (mins < 15) return ['<15m']
                            if (mins < 30) return ['15-30m']
                            if (mins < 60) return ['30-60m']
                            if (mins < 120) return ['1-2h']
                            if (mins < 240) return ['2-4h']
                            if (mins < 480) return ['4-8h']
                            return ['>8h']
                          }
                          case 'Entry Time (5m)':
                            return [bucketTime(t.entryTime || t.openTime, 5)]
                          case 'Entry Time (15m)':
                            return [bucketTime(t.entryTime || t.openTime, 15)]
                          case 'Entry Time (30m)':
                            return [bucketTime(t.entryTime || t.openTime, 30)]
                          case 'Entry Time (Hourly)':
                            return [bucketTime(t.entryTime || t.openTime, 60)]
                          case 'Exit Time (5m)':
                            return [bucketTime(t.exitTime || t.closeTime, 5)]
                          case 'Exit Time (15m)':
                            return [bucketTime(t.exitTime || t.closeTime, 15)]
                          case 'Exit Time (30m)':
                            return [bucketTime(t.exitTime || t.closeTime, 30)]
                          case 'Exit Time (Hourly)':
                            return [bucketTime(t.exitTime || t.closeTime, 60)]
                          case 'Position Size':
                            return [bucketNumber(t.contractsTraded, 1, 'Size')]
                          case 'R-Multiple':
                            return [bucketNumber(typeof t.rMultiple === 'number' ? t.rMultiple : undefined, 0.5, 'R')]
                          case 'Volume':
                            return [bucketNumber(t.volume, 100, 'Vol')]
                          default:
                            return ['Unknown']
                        }
                      }

                      // Aggregate stats for selected dimension
                      const bucketStats = new Map<string, { trades: number; pnl: number; wins: number; winRate: number }>()
                      modelTrades.forEach((t: any) => {
                        const keys = getKeysForTrade(t)
                        keys.forEach(key => {
                          if (!bucketStats.has(key)) bucketStats.set(key, { trades: 0, pnl: 0, wins: 0, winRate: 0 })
                          const s = bucketStats.get(key)!
                          s.trades += 1
                          s.pnl += (t.netPnl || 0)
                          if ((t.netPnl || 0) > 0) s.wins += 1
                        })
                      })
                      bucketStats.forEach((s) => {
                        s.winRate = s.trades > 0 ? (s.wins / s.trades) * 100 : 0
                      })

                      // Sort according to selected metric
                      const entries = Array.from(bucketStats.entries())
                      const metricSelector = (s: { trades: number; pnl: number; winRate: number }) => (
                        crossMetric === 'Win rate' ? s.winRate : crossMetric === 'P&L' ? s.pnl : s.trades
                      )
                      entries.sort((a, b) => metricSelector(b[1]) - metricSelector(a[1]))
                      const sliced = (scopeTop === 'Top' ? entries : entries.reverse()).slice(0, topN)

                      // Label for first column
                      const firstColLabelMap: Record<CrossDimension, string> = {
                        'Account': 'Account',
                        'Tag': 'Tag',
                        'Symbols': 'Symbol',
                        'Top 10 Symbols': 'Symbol',
                        'Bottom Top 10 Symbols': 'Symbol',
                        'Entry Price': 'Entry Price',
                        'Exit Price': 'Exit Price',
                        'Instrument': 'Instrument',
                        'Day of Week': 'Day',
                        'Month': 'Month',
                        'Trade Duration': 'Duration',
                        'Year': 'Year',
                        'Entry Time (5m)': 'Entry Time (5m)',
                        'Entry Time (15m)': 'Entry Time (15m)',
                        'Entry Time (30m)': 'Entry Time (30m)',
                        'Entry Time (Hourly)': 'Entry Time (Hr)',
                        'Exit Time (5m)': 'Exit Time (5m)',
                        'Exit Time (15m)': 'Exit Time (15m)',
                        'Exit Time (30m)': 'Exit Time (30m)',
                        'Exit Time (Hourly)': 'Exit Time (Hr)',
                        'Position Size': 'Position Size',
                        'R-Multiple': 'R-Multiple',
                        'Volume': 'Volume',
                      }

                      return (
                        <div key={model} className="mb-6">
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-3 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded">
                            {model}
                          </div>

                          {/* Headers */}
                          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            <div>{firstColLabelMap[crossDimension]}</div>
                            <div className="text-center">Win Rate</div>
                            <div className="text-center">P&L</div>
                            <div className="text-center">Trades</div>
                          </div>

                          {/* Rows */}
                          {sliced.map(([bucket, stats]) => (
                            <div key={`${model}-${bucket}`} className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                              <div className="text-sm text-gray-900 dark:text-white">{bucket}</div>
                              <div className="text-center">
                                <span className={`inline-block px-2 py-1 text-xs rounded ${
                                  stats.winRate >= 50
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                  {stats.winRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-center">
                                <span className={`inline-block px-2 py-1 text-xs rounded ${
                                  stats.pnl >= 0
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                  ${Math.abs(stats.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                                  {stats.trades}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No models available</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}