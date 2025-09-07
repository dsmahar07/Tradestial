'use client'

import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { OptimizedPerformanceChart } from '@/components/analytics/optimized-performance-chart'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { cn } from '@/lib/utils'
import { ChevronDown, TrendingUp, TrendingDown, Sparkles, Award } from 'lucide-react'

// Import analytics hook to get real data
import { useAnalytics, useChartData } from '@/hooks/use-analytics'
import { getDayOfWeek } from '@/utils/date-utils'

// Dynamic column headers based on filter
const getColumnHeaders = (filter: string) => {
  const headers = {
    'days': { period: 'Days', volume: 'Avg daily volume' },
    'months': { period: 'Months', volume: 'Avg monthly volume' },
    'trade-time': { period: 'Hours', volume: 'Avg trade volume' },
    'trade-duration': { period: 'Trade durations', volume: 'Avg daily volume' }
  }
  return headers[filter as keyof typeof headers] || headers.days
}

// (Removed stray closing brace from legacy code)

// Restored full Day & Time UI wired to reactive analytics
export default function DayTimePage() {
  usePageTitle('Analytics - Day & Time Report')

  // Analytics hooks
  const { trades, loading, error, getChartData } = useAnalytics()
  const { data: dailyPnLReactive } = useChartData('dailyPnL')
  const { data: cumulativePnLReactive } = useChartData('cumulativePnL')

  // UI state
  const [activeFilter, setActiveFilter] = useState('days')
  const [selectedMetric, setSelectedMetric] = useState<'GROSS P&L' | 'NET P&L'>('GROSS P&L')
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)
  const metricMenuRef = useRef<HTMLDivElement>(null)
  // Grace period to avoid blocking the page forever if analytics takes long
  const [waited, setWaited] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // Close metric dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (metricMenuRef.current && !metricMenuRef.current.contains(target)) {
        setMetricMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handlers for top navigation (kept for parity)
  const handleTabChange = (tabId: string) => {
    console.log('Active tab:', tabId)
  }
  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    console.log(`Selected ${itemId} from ${tabId} tab`)
  }

  // Helper to choose PnL field for summaries
  const getPnLValue = (trade: any) =>
    selectedMetric === 'NET P&L' ? (trade.netPnl || 0) : (trade.grossPnl ?? trade.netPnl ?? 0)

  // Local-safe helpers to avoid UTC date shifts
  const parseLocalDateYMD = (ymd?: string): Date | null => {
    if (!ymd || typeof ymd !== 'string') return null
    // Expect YYYY-MM-DD
    const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return null
    const year = parseInt(m[1], 10)
    const month = parseInt(m[2], 10) - 1
    const day = parseInt(m[3], 10)
    return new Date(year, month, day)
  }

  const parseLocalDateTime = (ymd?: string, hm?: string): Date | null => {
    const d = parseLocalDateYMD(ymd)
    if (!d) return null
    if (typeof hm !== 'string' || !/^[0-2]?\d:[0-5]\d/.test(hm)) return d
    const [hStr, mStr] = hm.split(':')
    const hours = parseInt(hStr, 10)
    const minutes = parseInt(mStr, 10)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, 0, 0)
  }

  // Compute summary rows from real trades
  const summaryData = (() => {
    if (!trades?.length) return [] as Array<any>

    switch (activeFilter) {
      case 'days': {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const groups: Record<number, any[]> = {}
        trades.forEach(trade => {
          const day = getDayOfWeek(trade.openDate || '')
          groups[day] = groups[day] || []
          groups[day].push(trade)
        })
        return dayNames.map((label, idx) => {
          const ts = groups[idx] || []
          const gross = ts.reduce((s, t) => s + getPnLValue(t), 0)
          const wins = ts.filter(t => getPnLValue(t) > 0)
          const losses = ts.filter(t => getPnLValue(t) < 0)
          const avgVol = ts.length ? ts.reduce((s, t) => s + (t.contractsTraded || 0), 0) / ts.length : 0
          const winRate = ts.length ? (wins.length / ts.length) * 100 : 0
          const avgWin = wins.length ? wins.reduce((s, t) => s + getPnLValue(t), 0) / wins.length : 0
          const avgLoss = losses.length ? losses.reduce((s, t) => s + getPnLValue(t), 0) / losses.length : 0
          return {
            period: label,
            avgLoss: avgLoss < 0 ? `-$${Math.abs(avgLoss).toFixed(2)}` : '$0',
            avgVolume: Number(avgVol.toFixed(1)),
            avgWin: `$${avgWin.toFixed(2)}`,
            grossPnL: `${gross >= 0 ? '' : '-'}$${Math.abs(gross).toFixed(2)}`,
            tradeCount: ts.length,
            winRate: `${winRate.toFixed(1)}%`,
            _grossNum: gross,
          }
        })
      }
      case 'months': {
        const groups: Record<string, any[]> = {}
        trades.forEach(t => {
          const key = (t.openDate || '').slice(0, 7) // YYYY-MM
          if (!key || key.length !== 7) return
          groups[key] = groups[key] || []
          groups[key].push(t)
        })
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
        const keys = Object.keys(groups).sort() // sorted by YYYY-MM
        return keys.map((key) => {
          const [yyyy, mm] = key.split('-')
          const mIdx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1))
          const label = `${monthNames[mIdx]} ${yyyy}`
          const ts = groups[key] || []
          const gross = ts.reduce((s, t) => s + getPnLValue(t), 0)
          const wins = ts.filter(t => getPnLValue(t) > 0)
          const losses = ts.filter(t => getPnLValue(t) < 0)
          const days = ts.length ? new Set(ts.map((t: any) => (t.openDate || '').split('T')[0])).size : 0
          const avgVol = days ? ts.reduce((s, t) => s + (t.contractsTraded || 0), 0) / days : 0
          const winRate = ts.length ? (wins.length / ts.length) * 100 : 0
          const avgWin = wins.length ? wins.reduce((s, t) => s + getPnLValue(t), 0) / wins.length : 0
          const avgLoss = losses.length ? losses.reduce((s, t) => s + getPnLValue(t), 0) / losses.length : 0
          return {
            period: label,
            avgLoss: avgLoss < 0 ? `-$${Math.abs(avgLoss).toFixed(2)}` : '$0',
            avgVolume: Number(avgVol.toFixed(1)),
            avgWin: `$${avgWin.toFixed(2)}`,
            grossPnL: `${gross >= 0 ? '' : '-'}$${Math.abs(gross).toFixed(2)}`,
            tradeCount: ts.length,
            winRate: `${winRate.toFixed(1)}%`,
            _grossNum: gross,
          }
        })
      }
      case 'trade-time': {
        const hourGroups: Record<number, any[]> = {}
        trades.forEach(t => {
          if (t.entryTime) {
            const hour = parseInt(String(t.entryTime).split(':')[0])
            hourGroups[hour] = hourGroups[hour] || []
            hourGroups[hour].push(t)
          }
        })
        const ranges = [
          { label: '00:00 - 06:00', hours: [0,1,2,3,4,5,6] },
          { label: '07:00 - 09:00', hours: [7,8,9] },
          { label: '10:00 - 12:00', hours: [10,11,12] },
          { label: '13:00 - 15:00', hours: [13,14,15] },
          { label: '16:00 - 18:00', hours: [16,17,18] },
          { label: '19:00 - 23:00', hours: [19,20,21,22,23] },
        ]
        return ranges.map(r => {
          const ts = r.hours.flatMap(h => hourGroups[h] || [])
          const gross = ts.reduce((s, t) => s + getPnLValue(t), 0)
          const wins = ts.filter(t => getPnLValue(t) > 0)
          const losses = ts.filter(t => getPnLValue(t) < 0)
          const avgVol = ts.length ? ts.reduce((s, t) => s + (t.contractsTraded || 0), 0) / ts.length : 0
          const winRate = ts.length ? (wins.length / ts.length) * 100 : 0
          const avgWin = wins.length ? wins.reduce((s, t) => s + getPnLValue(t), 0) / wins.length : 0
          const avgLoss = losses.length ? losses.reduce((s, t) => s + getPnLValue(t), 0) / losses.length : 0
          return {
            period: r.label,
            avgLoss: avgLoss < 0 ? `-$${Math.abs(avgLoss).toFixed(2)}` : '$0',
            avgVolume: Number(avgVol.toFixed(1)),
            avgWin: `$${avgWin.toFixed(2)}`,
            grossPnL: `${gross >= 0 ? '' : '-'}$${Math.abs(gross).toFixed(2)}`,
            tradeCount: ts.length,
            winRate: `${winRate.toFixed(1)}%`,
            _grossNum: gross,
          }
        })
      }
      case 'trade-duration': {
        const ranges = [
          { label: '<1m', min: 0, max: 1 },
          { label: '1-5m', min: 1, max: 5 },
          { label: '5-15m', min: 5, max: 15 },
          { label: '15-30m', min: 15, max: 30 },
          { label: '30-60m', min: 30, max: 60 },
          { label: '1-2h', min: 60, max: 120 },
          { label: '2-4h', min: 120, max: 240 },
          { label: '>4h', min: 240, max: Infinity },
        ]
        const buckets: Record<string, any[]> = {}
        ranges.forEach(r => (buckets[r.label] = []))
        trades.forEach(t => {
          if (t.entryTime && t.exitTime) {
            const entry = parseLocalDateTime(t.openDate, t.entryTime)
            const exit = parseLocalDateTime(t.closeDate || t.openDate, t.exitTime)
            if (!entry || !exit) return
            const mins = (exit.getTime() - entry.getTime()) / 60000
            const r = ranges.find(x => mins >= x.min && mins < x.max)
            if (r) buckets[r.label].push(t)
          }
        })
        return ranges.map(r => {
          const ts = buckets[r.label]
          const gross = ts.reduce((s, t) => s + getPnLValue(t), 0)
          const wins = ts.filter(t => getPnLValue(t) > 0)
          const losses = ts.filter(t => getPnLValue(t) < 0)
          const avgVol = ts.length ? ts.reduce((s, t) => s + (t.contractsTraded || 0), 0) / ts.length : 0
          const winRate = ts.length ? (wins.length / ts.length) * 100 : 0
          const avgWin = wins.length ? wins.reduce((s, t) => s + getPnLValue(t), 0) / wins.length : 0
          const avgLoss = losses.length ? losses.reduce((s, t) => s + getPnLValue(t), 0) / losses.length : 0
          return {
            period: r.label,
            avgLoss: avgLoss < 0 ? `-$${Math.abs(avgLoss).toFixed(2)}` : '$0',
            avgVolume: Number(avgVol.toFixed(1)),
            avgWin: `$${avgWin.toFixed(2)}`,
            grossPnL: `${gross >= 0 ? '' : '-'}$${Math.abs(gross).toFixed(2)}`,
            tradeCount: ts.length,
            winRate: `${winRate.toFixed(1)}%`,
            _grossNum: gross,
          }
        })
      }
      default:
        return [] as Array<any>
    }
  })()

  // Compute dynamic top metrics from summary rows
  const topMetrics = (() => {
    if (!summaryData.length) return [] as Array<any>
    const byGross = [...summaryData].sort((a, b) => b._grossNum - a._grossNum)
    const byLeast = [...summaryData].sort((a, b) => a._grossNum - b._grossNum)
    const byTrades = [...summaryData].sort((a, b) => b.tradeCount - a.tradeCount)
    const byWin = [...summaryData].sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
    return [
      { label: activeFilter === 'days' ? 'Best performing day' : activeFilter === 'months' ? 'Best performing month' : activeFilter === 'trade-time' ? 'Best performing hour' : 'Best performing trade duration', value: byGross[0]?.period ?? '-', subValue: `${byGross[0]?.tradeCount ?? 0} trades • ${byGross[0]?.grossPnL ?? '$0'}`, positive: true },
      { label: activeFilter === 'days' ? 'Least performing day' : activeFilter === 'months' ? 'Least performing month' : activeFilter === 'trade-time' ? 'Least performing hour' : 'Least performing trade duration', value: byLeast[0]?.period ?? '-', subValue: `${byLeast[0]?.tradeCount ?? 0} trades • ${byLeast[0]?.grossPnL ?? '$0'}`, positive: byLeast[0]?._grossNum >= 0 },
      { label: activeFilter === 'days' ? 'Most active day' : activeFilter === 'months' ? 'Most active month' : activeFilter === 'trade-time' ? 'Most active hour' : 'Most active trade duration', value: byTrades[0]?.period ?? '-', subValue: `${byTrades[0]?.tradeCount ?? 0} trades`, positive: true },
      { label: 'Best win rate', value: byWin[0]?.period ?? '-', subValue: `${byWin[0]?.winRate ?? '0%'} • ${byWin[0]?.tradeCount ?? 0} trades`, positive: true },
    ]
  })()

  // Reactive chart series (with fallbacks)
  const dailyPnLFallback = (() => {
    if (!trades?.length) return [] as Array<{ date: string; value: number }>
    const m = new Map<string, number>()
    trades.forEach(t => {
      const key = (t.openDate || '').split('T')[0]
      if (!key) return
      m.set(key, (m.get(key) || 0) + (t.netPnl || 0))
    })
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }))
  })()

  const cumulativePnLFallback = (() => {
    const base = (dailyPnLReactive || []).map((d: any) => ({ date: d.date, value: d.pnl }))
    const daily = base.length ? base : dailyPnLFallback
    let run = 0
    return daily.map(p => ({ date: p.date, value: (run += p.value) }))
  })()

  const leftData = {
    title: 'Daily Net P&L',
    data: (dailyPnLReactive || []).map((d: any) => ({ date: d.date, value: d.pnl })) || [],
    color: '#335CFF',
    timeframe: 'Day' as const,
  }
  const rightData = {
    title: 'Cumulative P&L',
    data: (cumulativePnLReactive || []).map((d: any) => ({ date: d.date, value: d.cumulative })) || [],
    color: '#FA7319',
    timeframe: 'Day' as const,
  }
  if (!leftData.data.length) leftData.data = dailyPnLFallback
  if (!rightData.data.length) rightData.data = cumulativePnLFallback

  // Async metric provider (same mapping used on Performance page)
  const onDataRequest = async (metric: string) => {
    const name = metric.toLowerCase()
    let chartType: string | null = null
    if (name.includes('cumulative p&l') || name.includes('net account balance') || name.includes('equity')) chartType = 'equityCurve'
    else if (name.includes('avg daily net p&l') || name.includes('daily net p&l') || name === 'net p&l') chartType = 'dailyPnL'
    else if (name.includes('avg daily net drawdown') || name.includes('daily net drawdown') || name.includes('max daily net drawdown')) chartType = 'dailyDrawdown'
    else if (name.includes('cumulative') || name.includes('p&l - cumulative')) chartType = 'cumulativePnL'
    else if (name.includes('volume')) chartType = 'dailyVolume'
    else if (name.includes('trade count') || name.includes('# of trades') || name.includes('trades per day')) chartType = 'dailyTradeCount'
    else if (name.includes('active days') || name.includes('logged days')) chartType = 'dailyActiveDays'
    else if (name.includes('win rate over time') || name.includes('win % over time') || name === 'win %' || name === 'win%' || name.includes('win%') || name.includes('avg daily win%') || name.includes('avg daily win %') || (name.includes('avg') && (name.includes('win %') || name.includes('win%')))) chartType = 'winRateOverTime'
    else if (name.includes('longs win') || name.includes('long win rate') || name.includes('long win%') || name.includes('long win %') || name.includes('long win')) chartType = 'longWinRateOverTime'
    else if (name.includes('shorts win') || name.includes('short win rate') || name.includes('short win%') || name.includes('short win %') || name.includes('short win')) chartType = 'shortWinRateOverTime'
    else if (name.includes('avg win')) chartType = 'dailyAvgWin'
    else if (name === 'avg loss' || name.includes('average loss')) chartType = 'dailyAvgLoss'
    else if (name.includes('profit factor')) chartType = 'profitFactorOverTime'
    else if (name.includes('expectancy')) chartType = 'expectancyOverTime'
    else if (name.includes('avg daily win/loss') || name.includes('avg win/loss') || name.includes('avg trade win/loss')) chartType = 'dailyAvgWinLoss'
    else if (name.includes('avg net trade p&l') || name.includes('avg trade p&l')) chartType = 'dailyAvgNetTradePnl'
    else if (name.includes('max consecutive winning days') || name.includes('longest winning days streak')) chartType = 'maxConsecutiveWinningDaysOverTime'
    else if (name.includes('max consecutive losing days') || name.includes('longest losing days streak')) chartType = 'maxConsecutiveLosingDaysOverTime'
    else if (name.includes('max consecutive wins') || name.includes('longest wins streak')) chartType = 'maxConsecutiveWinsOverTime'
    else if (name.includes('max consecutive losses') || name.includes('longest losses streak')) chartType = 'maxConsecutiveLossesOverTime'
    else if (name.includes('breakeven days') || name.includes('breakeven days over time')) chartType = 'dailyBreakevenDays'
    else if (name.includes('breakeven trades') || name.includes('breakeven trades over time')) chartType = 'dailyBreakevenTrades'
    else if (name.includes('long trades')) chartType = 'dailyLongTrades'
    else if (name.includes('short trades')) chartType = 'dailyShortTrades'
    else if ((name.includes('long') && name.includes('winning') && name.includes('trades')) || name.includes('long winning trades')) chartType = 'dailyLongWinningTrades'
    else if ((name.includes('short') && name.includes('winning') && name.includes('trades')) || name.includes('short winning trades')) chartType = 'dailyShortWinningTrades'
    else if ((name.includes('long') && name.includes('losing') && name.includes('trades')) || name.includes('long losing trades')) chartType = 'dailyLongLosingTrades'
    else if ((name.includes('short') && name.includes('losing') && name.includes('trades')) || name.includes('short losing trades')) chartType = 'dailyShortLosingTrades'
    else if (
      name.includes('avg hold time') ||
      name.includes('avg trade duration') ||
      name.includes('average trading days duration') ||
      name.includes('avg trading days duration')
    ) chartType = 'dailyAvgHoldTimeHours'
    else if (
      name.includes('max hold time') ||
      name.includes('longest trade duration') ||
      name.includes('max trading days duration')
    ) chartType = 'dailyMaxHoldTimeHours'
    else if (name.includes('largest losing trade') || name.includes('max trade loss') || name.includes('avg max trade loss')) chartType = 'dailyMaxLoss'
    else if (name.includes('largest profitable trade') || name.includes('max trade profit') || name.includes('avg max trade profit')) chartType = 'dailyMaxWin'
    else if (name.includes('planned r-multiple') || name.includes('planned r multiple')) chartType = 'plannedRMultipleOverTime'
    else if (name.includes('realized r-multiple') || name.includes('realized r multiple')) chartType = 'realizedRMultipleOverTime'
    else if (name.includes('profit factor')) chartType = 'profitFactorOverTime'
    else if (name.includes('expectancy')) chartType = 'expectancyOverTime'
    else if (name.includes('avg daily win/loss') || name.includes('avg net trade p&l') || name.includes('avg trade p&l')) chartType = 'dailyAvgNetTradePnl'

    if (!chartType) return { title: metric, data: [] as Array<{ date: string; value: number }> }
    const series = await getChartData(chartType)
    const mapped = (series || []).map((d: any) => {
      if ('pnl' in d) return { date: d.date, value: d.pnl }
      if ('cumulative' in d) return { date: d.date, value: d.cumulative }
      if ('equity' in d) return { date: d.date, value: d.equity }
      if ('drawdown' in d) return { date: d.date, value: d.drawdown }
      if ('value' in d) return { date: d.date, value: d.value }
      return { date: d.date ?? '', value: 0 }
    })
    return { title: metric, data: mapped }
  }

  // Loading / empty states
  if (error) return <div className="space-y-6"><div className="text-sm text-red-600 dark:text-red-400">Error: {error}</div></div>
  // Show brief loading, then proceed to render UI even if backend still processing
  if (loading && !waited) return <div className="space-y-6"><div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Loading day & time analytics...</div></div>

  // Filters metadata
  const filters = [
    { id: 'days', label: 'days' },
    { id: 'months', label: 'months' },
    { id: 'trade-time', label: 'trade time' },
    { id: 'trade-duration', label: 'trade duration' },
  ]

  const columnHeaders = getColumnHeaders(activeFilter)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#0f0f0f]">
          <AnalyticsTabNavigation
            tabs={analyticsNavigationConfig.map(tab => ({ ...tab, isActive: tab.id === 'reports' }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
          <div className="space-y-6">
            {/* No Data State */}
            {!loading && !error && (!trades || trades.length === 0) && (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No trading data available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Import your CSV file to view day & time analytics
                </p>
                <button 
                  onClick={() => window.location.href = '/import-data'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Import Trading Data
                </button>
              </div>
            )}

            {trades && trades.length > 0 && (
              <>
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topMetrics.map((metric, index) => (
                <div key={index} className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#0f0f0f]">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {(() => {
                      const isBest = metric.label.includes('Best performing')
                      const isLeast = metric.label.includes('Least')
                      const isActive = metric.label.includes('Most active')
                      const iconClass = isBest ? 'text-[#10B981]' : isLeast ? 'text-red-600' : isActive ? 'text-amber-500' : 'text-violet-600'
                      const IconComp = isBest ? TrendingUp : isLeast ? TrendingDown : isActive ? Sparkles : Award
                      return <IconComp className={`w-4 h-4 ${iconClass}`} />
                    })()}
                    <span>{metric.label}</span>
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-2">{metric.value}</div>
                  {(() => {
                    const parts = String(metric.subValue).split('•').map(p => p.trim())
                    const hasPnL = parts.some(p => p.includes('$'))
                    const leftText = hasPnL ? parts.find(p => !p.includes('$')) : parts.join(' / ')
                    const rightText = hasPnL ? parts.find(p => p.includes('$')) : null
                    return (
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{leftText}</span>
                        {rightText ? (
                          <span className={cn('px-2 py-0.5 rounded-full font-semibold', metric.positive ? 'bg-[#10B981]/10 text-[#10B981] dark:bg-[#10B981]/20 dark:text-[#10B981]' : 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300')}>
                            {rightText}
                          </span>
                        ) : null}
                      </div>
                    )
                  })()}
                </div>
              ))}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center rounded-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      'px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
                      'border-r border-gray-300 dark:border-gray-700 last:border-r-0',
                      activeFilter === filter.id
                        ? 'bg-indigo-100 text-indigo-700 font-semibold dark:bg-indigo-500/20 dark:text-indigo-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-[#0f0f0f] dark:text-gray-300 dark:hover:bg-gray-800/60'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="relative" ref={metricMenuRef}>
                <button
                  onClick={() => setMetricMenuOpen(o => !o)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[140px] justify-between focus:outline-none"
                  aria-label="Select header metric"
                  aria-expanded={metricMenuOpen}
                  aria-haspopup="true"
                >
                  <span>{selectedMetric}</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', metricMenuOpen && 'rotate-180')} />
                </button>
                {metricMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[160px] overflow-hidden z-50">
                    <button onClick={() => { setSelectedMetric('GROSS P&L'); setMetricMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150" role="option" aria-selected={selectedMetric === 'GROSS P&L'}>
                      Gross P&L
                    </button>
                    <button onClick={() => { setSelectedMetric('NET P&L'); setMetricMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150" role="option" aria-selected={selectedMetric === 'NET P&L'}>
                      Net P&L
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OptimizedPerformanceChart
                data={leftData as any}
                onDataRequest={onDataRequest}
                contextInfo={{
                  subTab: activeFilter,
                  getPeriodLabel: (date: string, idx: number) => {
                    switch (activeFilter) {
                      case 'days': {
                        // Don't use hardcoded array index! Parse the actual date to get correct day
                        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                          const dayOfWeek = getDayOfWeek(date)
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                          return dayNames[dayOfWeek] || `Day ${dayOfWeek + 1}`
                        }
                        // Fallback to index-based for non-date formats
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                        return dayNames[idx] || `Day ${idx + 1}`
                      }
                      case 'months': {
                        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
                        // Parse month from actual date when possible
                        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                          const yyyy = date.slice(0, 4)
                          const mm = parseInt(date.slice(5, 7), 10)
                          const mIdx = isNaN(mm) ? -1 : mm - 1
                          const month = monthNames[mIdx] || `Month ${idx + 1}`
                          return `${month} ${yyyy}`
                        }
                        // Fallback to index mapping only if date is not in YYYY-MM-DD format
                        return monthNames[idx] || `Month ${idx + 1}`
                      }
                      case 'trade-time': {
                        const timeRanges = ['00:00 - 06:00','07:00 - 09:00','10:00 - 12:00','13:00 - 15:00','16:00 - 18:00','19:00 - 23:00']
                        return timeRanges[idx] || `Time ${idx + 1}`
                      }
                      case 'trade-duration': {
                        const durationRanges = ['<1m','1-5m','5-15m','15-30m','30-60m','1-2h','2-4h','>4h']
                        return durationRanges[idx] || `Duration ${idx + 1}`
                      }
                      default:
                        return date
                    }
                  },
                }}
              />
              <OptimizedPerformanceChart
                data={rightData as any}
                onDataRequest={onDataRequest}
                contextInfo={{
                  subTab: activeFilter,
                  getPeriodLabel: (date: string, idx: number) => {
                    switch (activeFilter) {
                      case 'days': {
                        // Don't use hardcoded array index! Parse the actual date to get correct day
                        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                          const dayOfWeek = getDayOfWeek(date)
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                          return dayNames[dayOfWeek] || `Day ${dayOfWeek + 1}`
                        }
                        // Fallback to index-based for non-date formats
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                        return dayNames[idx] || `Day ${idx + 1}`
                      }
                      case 'months': {
                        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
                        // Parse month from actual date when possible
                        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                          const mm = parseInt(date.slice(5, 7), 10)
                          const mIdx = isNaN(mm) ? -1 : mm - 1
                          return monthNames[mIdx] || `Month ${idx + 1}`
                        }
                        // Fallback to index mapping only if date is not in YYYY-MM-DD format
                        return monthNames[idx] || `Month ${idx + 1}`
                      }
                      case 'trade-time': {
                        const timeRanges = ['00:00 - 06:00','07:00 - 09:00','10:00 - 12:00','13:00 - 15:00','16:00 - 18:00','19:00 - 23:00']
                        return timeRanges[idx] || `Time ${idx + 1}`
                      }
                      case 'trade-duration': {
                        const durationRanges = ['<1m','1-5m','5-15m','15-30m','30-60m','1-2h','2-4h','>4h']
                        return durationRanges[idx] || `Duration ${idx + 1}`
                      }
                      default:
                        return date
                    }
                  },
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
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">{columnHeaders.period}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg loss</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">{columnHeaders.volume}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg win</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Gross P&L</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Trade count</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-white font-medium">{row.period}</td>
                        <td className={cn('py-4 px-6 text-sm', String(row.avgLoss).includes('-') ? 'text-red-500' : 'text-gray-900 dark:text-white')}>{row.avgLoss}</td>
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">{row.avgVolume}</td>
                        <td className={cn('py-4 px-6 text-sm', row.avgWin !== '$0' ? 'text-[#10B981]' : 'text-gray-900 dark:text-white')}>{row.avgWin}</td>
                        <td className={cn('py-4 px-6 text-sm font-medium', String(row.grossPnL).includes('-') ? 'text-red-500' : row.grossPnL !== '$0' ? 'text-[#10B981]' : 'text-gray-900 dark:text-white')}>{row.grossPnL}</td>
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">{row.tradeCount}</td>
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">{row.winRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross Analysis */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cross analysis</h2>
                  <div className="flex items-center gap-4">
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
                      <option>Account</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
                      <option>Win rate</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
                      <option>P&L</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
                      <option>Trades</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {summaryData.map((item: any, index: number) => {
                    const pnlValue = parseFloat(String(item.grossPnL).replace(/[$,]/g, '')) * (String(item.grossPnL).includes('-') ? -1 : 1)
                    const maxValue = Math.max(...summaryData.map((d: any) => Math.abs(parseFloat(String(d.grossPnL).replace(/[$,]/g, ''))))) || 1
                    const barWidth = Math.abs(pnlValue) / maxValue * 100
                    const isPositive = pnlValue >= 0
                    return (
                      <div key={index} className="flex items-center">
                        <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{item.period}</div>
                        <div className="flex-1 relative h-8">
                          {pnlValue !== 0 && (
                            <div className={cn('h-full rounded flex items-center justify-end pr-2', isPositive ? 'bg-[#10B981]' : 'bg-red-500')} style={{ width: `${barWidth}%` }}>
                              <span className="text-white text-sm font-medium">{item.grossPnL}</span>
                            </div>
                          )}
                          {pnlValue === 0 && (
                            <div className="h-full flex items-center">
                              <span className="text-gray-400 text-sm">$0</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 text-right text-xs text-gray-500 dark:text-gray-400">TradingView Paper Trading</div>
              </div>
            </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
