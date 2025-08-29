'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { PerformanceChart } from './performance-chart'
import { MetricGrid } from './metric-card'
import { ZellaScale } from './zella-scale'
import { PerformanceTabs } from './performance-tabs'
import { PerformanceTab, PerformanceData } from '@/types/performance'
import { useAnalytics, useChartData } from '@/hooks/use-analytics'
import { Trade } from '@/services/trade-data.service'
import { DataStore } from '@/services/data-store.service'
import { calculateRMultipleMetrics, calculateTradeRMultiple } from '@/utils/r-multiple'
import TradeMetadataService from '@/services/trade-metadata.service'

// Default empty data structure
const emptyPerformanceData: PerformanceData = {
  metrics: {
    netPnL: { value: 0, isPositive: true },
    winRate: { value: 0, isPositive: true },
    avgDailyWinRate: { value: 0, isPositive: true },
    profitFactor: { value: 0, isPositive: true },
    tradeExpectancy: { value: 0, isPositive: true },
    avgDailyWinLoss: { value: 0, isPositive: true },
    avgTradeWinLoss: { value: 0, isPositive: true },
    avgHoldTime: { value: 0, formatted: '0m' },
    avgNetTradePnL: { value: 0, isPositive: true },
    avgDailyNetPnL: { value: 0, isPositive: true },
    avgPlannedRMultiple: { value: 0, formatted: '0R' },
    avgRealizedRMultiple: { value: 0, formatted: '0R' },
    avgDailyVolume: { value: 0 },
    loggedDays: { value: 0 },
    maxDailyNetDrawdown: { value: 0, isPositive: false },
    avgNetDrawdown: { value: 0, isPositive: false },
    largestLosingDay: { value: 0, isPositive: false },
    avgTradingDaysDuration: { value: 0, formatted: '0m' },
    largestProfitableDay: { value: 0, isPositive: true },
    zellaScale: { current: 0, max: 10, color: 'red' },
    longsWinRate: { value: 0, isPositive: true },
    largestProfitableTrade: { value: 0, isPositive: true },
    largestLosingTrade: { value: 0, isPositive: false },
    longestTradeDuration: { value: 0, formatted: '0m' },
    shortsWinRate: { value: 0, isPositive: true }
  },
  charts: {
    avgPlannedRMultiple: {
      title: 'Avg. planned r-multiple',
      data: [],
      color: '#F97316',
      timeframe: 'Day'
    },
    avgLoss: {
      title: 'Avg loss - cumulative',
      data: [],
      color: '#F97316',
      timeframe: 'Week'
    }
  }
}

interface PerformancePageProps {
  data?: PerformanceData
}

export function PerformancePage({ data }: PerformancePageProps) {
  const [activeTab, setActiveTab] = useState<PerformanceTab>('Summary')
  const { trades, loading, error, getChartData } = useAnalytics()

  // Reactive chart data sources
  const { data: dailyPnLReactive } = useChartData('dailyPnL')
  const { data: cumulativePnLReactive } = useChartData('cumulativePnL')
  // Planned R-multiple reactive time series
  const { data: plannedRMultipleReactive } = useChartData('plannedRMultipleOverTime')
  // Realized R-multiple reactive time series (prefetch for quick switching)
  const { data: realizedRMultipleReactive } = useChartData('realizedRMultipleOverTime')
  // Hold time series for accurate time-based KPIs
  const { data: dailyMaxHoldTimeReactive } = useChartData('dailyMaxHoldTimeHours')
  const { data: dailyAvgHoldTimeReactive } = useChartData('dailyAvgHoldTimeHours')

  // Calculate real performance data from trades
  const performanceData: PerformanceData = useMemo(() => {
    if (!trades?.length) return emptyPerformanceData

    // Calculate basic metrics
    const totalTrades = trades.length
    const winningTrades = trades.filter(trade => trade.netPnl > 0)
    const losingTrades = trades.filter(trade => trade.netPnl < 0)
    const totalNetPnL = trades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0

    // Calculate profit factor
    const totalWins = winningTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.netPnl, 0))
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0

    // Calculate average trade metrics
    const avgTrade = totalTrades > 0 ? totalNetPnL / totalTrades : 0
    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0

    // Calculate largest trades
    const sortedWins = winningTrades.sort((a, b) => b.netPnl - a.netPnl)
    const sortedLosses = losingTrades.sort((a, b) => a.netPnl - b.netPnl)
    const largestWin = sortedWins[0]?.netPnl || 0
    const largestLoss = sortedLosses[0]?.netPnl || 0

    // Calculate daily P&L data
    const dailyPnL = new Map<string, number>()
    trades.forEach(trade => {
      const dateKey = trade.openDate.split('T')[0]
      dailyPnL.set(dateKey, (dailyPnL.get(dateKey) || 0) + trade.netPnl)
    })

    const dailyPnLArray = Array.from(dailyPnL.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => ({ date, value: pnl }))

    const avgDailyPnL = dailyPnLArray.length > 0 
      ? dailyPnLArray.reduce((sum, day) => sum + day.value, 0) / dailyPnLArray.length 
      : 0

    // Calculate volume metrics
    const totalVolume = trades.reduce((sum, trade) => sum + (trade.contractsTraded || 1), 0)
    const avgDailyVolume = dailyPnLArray.length > 0 ? totalVolume / dailyPnLArray.length : 0

    // Calculate Zella Score (simplified)
    const zellaScore = Math.min(10, Math.max(0, 
      (winRate / 10) + (profitFactor) + (totalNetPnL / 10000)
    ))

    // Calculate side-specific win rates
    const longTrades = trades.filter(trade => trade.side === 'LONG')
    const shortTrades = trades.filter(trade => trade.side === 'SHORT')
    const longsWinRate = longTrades.length > 0 
      ? (longTrades.filter(t => t.netPnl > 0).length / longTrades.length) * 100 
      : 0
    const shortsWinRate = shortTrades.length > 0 
      ? (shortTrades.filter(t => t.netPnl > 0).length / shortTrades.length) * 100 
      : 0

    return {
      metrics: {
        netPnL: { value: totalNetPnL, isPositive: totalNetPnL >= 0 },
        winRate: { value: winRate, isPositive: winRate >= 50 },
        avgDailyWinRate: { value: winRate, isPositive: winRate >= 50 }, // Simplified
        profitFactor: { value: profitFactor, isPositive: profitFactor >= 1 },
        tradeExpectancy: { value: avgTrade, isPositive: avgTrade >= 0 },
        avgDailyWinLoss: { value: avgWin - avgLoss, isPositive: avgWin > avgLoss },
        avgTradeWinLoss: { value: avgTrade, isPositive: avgTrade >= 0 },
        avgHoldTime: { value: 0, formatted: '0m' }, // Would need time calculations
        avgNetTradePnL: { value: avgTrade, isPositive: avgTrade >= 0 },
        avgDailyNetPnL: { value: avgDailyPnL, isPositive: avgDailyPnL >= 0 },
        avgPlannedRMultiple: { value: 0, formatted: '0R' }, // Would need R-multiple data
        avgRealizedRMultiple: { value: 0, formatted: '0R' },
        avgDailyVolume: { value: avgDailyVolume },
        loggedDays: { value: dailyPnLArray.length },
        maxDailyNetDrawdown: { value: Math.min(...dailyPnLArray.map(d => d.value)), isPositive: false },
        avgNetDrawdown: { value: 0, isPositive: false }, // Would need drawdown calculation
        largestLosingDay: { value: Math.min(...dailyPnLArray.map(d => d.value)), isPositive: false },
        avgTradingDaysDuration: { value: 0, formatted: '0m' },
        largestProfitableDay: { value: Math.max(...dailyPnLArray.map(d => d.value)), isPositive: true },
        zellaScale: { current: zellaScore, max: 10, color: zellaScore > 6 ? 'green' : zellaScore > 3 ? 'yellow' : 'red' },
        longsWinRate: { value: longsWinRate, isPositive: longsWinRate >= 50 },
        largestProfitableTrade: { value: largestWin, isPositive: true },
        largestLosingTrade: { value: largestLoss, isPositive: false },
        longestTradeDuration: { value: 0, formatted: '0m' },
        shortsWinRate: { value: shortsWinRate, isPositive: shortsWinRate >= 50 }
      },
      charts: {
        avgPlannedRMultiple: {
          title: 'Avg. planned r-multiple',
          data: [],
          color: '#F97316',
          timeframe: 'Day'
        },
        avgLoss: {
          title: 'Cumulative P&L',
          data: dailyPnLArray.map((point, index) => ({
            date: point.date,
            value: dailyPnLArray.slice(0, index + 1).reduce((sum, p) => sum + p.value, 0)
          })),
          color: '#F97316',
          timeframe: 'Day'
        }
      }
    }
  }, [trades])

  // Prefer reactive series when available; fallback to locally computed performanceData
  const actualData: PerformanceData = useMemo(() => {
    const base = data || performanceData

    const mappedDaily = (dailyPnLReactive || []).map((d: any) => ({ date: d.date, value: d.pnl }))
    const mappedCum = (cumulativePnLReactive || []).map((d: any) => ({ date: d.date, value: d.cumulative }))

    // Map planned R-multiple series if available
    const mappedPlannedR = (plannedRMultipleReactive || []).map((d: any) => ({ date: d.date, value: 'value' in d ? d.value : d.r ?? d.pnl ?? 0 }))
    // Fallback: compute planned R-multiple over time from trades if reactive is empty
    const fallbackPlannedR: Array<{ date: string; value: number }> = (() => {
      if (mappedPlannedR.length || !(trades && trades.length)) return []
      const byDate: Record<string, number[]> = {}
      for (const t of trades as Trade[]) {
        const dateKey = (t.openDate || '').split('T')[0]
        if (!dateKey) continue
        const md = TradeMetadataService.getTradeMetadata(t.id) || undefined
        const { plannedRMultiple } = calculateTradeRMultiple(t, md)
        if (plannedRMultiple !== null && !isNaN(plannedRMultiple)) {
          if (!byDate[dateKey]) byDate[dateKey] = []
          byDate[dateKey].push(plannedRMultiple)
        }
      }
      return Object.entries(byDate)
        .map(([date, arr]) => ({ date, value: arr.reduce((s, v) => s + v, 0) / arr.length }))
        .sort((a, b) => a.date.localeCompare(b.date))
    })()
    // Map realized R-multiple series if available
    const mappedRealizedR = (realizedRMultipleReactive || []).map((d: any) => ({ date: d.date, value: 'value' in d ? d.value : d.r ?? d.pnl ?? 0 }))

    // Compute KPIs from trade-level R-multiple metrics to avoid zero-inflation from empty days
    const rMetrics = calculateRMultipleMetrics(trades as Trade[], (id: string) => TradeMetadataService.getTradeMetadata(id))
    const plannedRAvg = rMetrics.avgPlannedRMultiple
    const realizedRAvg = rMetrics.avgRealizedRMultiple

    // -------- Time-based KPIs (in minutes for MetricCard's time formatter) --------
    // Local helpers mirroring ReactiveAnalyticsService.getTradeDurationHours()
    const parseDurationToHours = (dur: string): number => {
      const s = dur.trim().toUpperCase()
      const iso = /^P(T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)$/
      const mIso = s.match(iso)
      if (mIso) {
        const h = parseFloat(mIso[2] || '0')
        const m = parseFloat(mIso[3] || '0')
        const sec = parseFloat(mIso[4] || '0')
        return h + m / 60 + sec / 3600
      }
      const hm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
      const mHm = s.match(hm)
      if (mHm) {
        const h = parseFloat(mHm[1] || '0')
        const m = parseFloat(mHm[2] || '0')
        const sec = parseFloat(mHm[3] || '0')
        return h + m / 60 + sec / 3600
      }
      let total = 0
      const hMatch = s.match(/(\d+(?:\.\d+)?)\s*H/)
      const mMatch = s.match(/(\d+(?:\.\d+)?)\s*M/)
      const sMatch = s.match(/(\d+(?:\.\d+)?)\s*S/)
      if (hMatch) total += parseFloat(hMatch[1])
      if (mMatch) total += parseFloat(mMatch[1]) / 60
      if (sMatch) total += parseFloat(sMatch[1]) / 3600
      if (total > 0) return total
      const plainMin = s.match(/^(\d+(?:\.\d+)?)(?:\s*M)?$/)
      if (plainMin) return parseFloat(plainMin[1]) / 60
      return 0
    }

    const getTradeDurationHours = (trade: Trade): number => {
      const openIso = trade.openDate || ''
      const closeIso = trade.closeDate || trade.openDate || ''
      const openDateStr = openIso.split('T')[0]
      const closeDateStr = closeIso.split('T')[0]
      const entryTime = (trade as any).entryTime || (trade as any).openTime || (trade as any).entry_time || ''
      const exitTime = (trade as any).exitTime || (trade as any).closeTime || (trade as any).bestExitTime || (trade as any).exit_time || ''

      let start: Date
      if (openDateStr && entryTime) start = new Date(`${openDateStr}T${entryTime}`)
      else if (openIso) start = new Date(openIso)
      else if (openDateStr) start = new Date(openDateStr)
      else start = new Date(0)

      let end: Date
      if (closeDateStr && exitTime) end = new Date(`${closeDateStr}T${exitTime}`)
      else if (closeIso) end = new Date(closeIso)
      else if (closeDateStr) end = new Date(closeDateStr)
      else end = new Date(0)

      const ms = end.getTime() - start.getTime()
      const hours = ms / 3600000
      let safeHours = Number.isFinite(hours) && hours >= 0 ? hours : 0
      if (safeHours === 0 && (trade as any).duration) {
        const parsed = parseDurationToHours(String((trade as any).duration))
        if (parsed > 0) safeHours = parsed
      }
      return safeHours
    }

    const durationsH = (trades as Trade[]).map(getTradeDurationHours).filter(v => Number.isFinite(v) && v >= 0)
    const localAvgHoldMinutes = durationsH.length ? (durationsH.reduce((s, v) => s + v, 0) / durationsH.length) * 60 : 0
    const localLongestMinutes = durationsH.length ? Math.max(...durationsH) * 60 : 0

    // Prefer reactive series for accuracy and correct loading sync
    const reactiveLongestMinutes = (() => {
      const vals = (dailyMaxHoldTimeReactive || []).map((d: any) => (typeof d.value === 'number' ? d.value : 0)).filter((v: number) => Number.isFinite(v) && v >= 0)
      return vals.length ? Math.max(...vals) * 60 : undefined
    })()
    const reactiveAvgHoldMinutes = (() => {
      const vals = (dailyAvgHoldTimeReactive || []).map((d: any) => (typeof d.value === 'number' ? d.value : 0)).filter((v: number) => Number.isFinite(v) && v >= 0)
      return vals.length ? (vals.reduce((s: number, v: number) => s + v, 0) / vals.length) * 60 : undefined
    })()

    // Average trading day duration: for each openDate (YYYY-MM-DD), span between earliest start and latest end
    const byDay: Record<string, { start: number; end: number }> = {}
    for (const t of trades as Trade[]) {
      const openIso = t.openDate || ''
      const closeIso = t.closeDate || t.openDate || ''
      const dateKey = (openIso || '').split('T')[0]
      if (!dateKey) continue
      const entryTime = (t as any).entryTime || (t as any).openTime || (t as any).entry_time || ''
      const exitTime = (t as any).exitTime || (t as any).closeTime || (t as any).bestExitTime || (t as any).exit_time || ''
      const start = entryTime ? new Date(`${dateKey}T${entryTime}`).getTime() : new Date(openIso || dateKey).getTime()
      const end = exitTime
        ? new Date(`${(closeIso || dateKey).split('T')[0]}T${exitTime}`).getTime()
        : new Date(closeIso || dateKey).getTime()
      if (!byDay[dateKey]) byDay[dateKey] = { start, end }
      else {
        byDay[dateKey].start = Math.min(byDay[dateKey].start, start)
        byDay[dateKey].end = Math.max(byDay[dateKey].end, end)
      }
    }
    const dayDurationsH = Object.values(byDay)
      .map(({ start, end }) => Math.max(0, (end - start) / 3600000))
      .filter(v => Number.isFinite(v))
    const avgTradingDayMinutes = dayDurationsH.length ? (dayDurationsH.reduce((s, v) => s + v, 0) / dayDurationsH.length) * 60 : 0

    return {
      ...base,
      metrics: {
        ...base.metrics,
        // Override with reactive averages when available
        avgPlannedRMultiple: {
          value: plannedRAvg,
          formatted: `${plannedRAvg.toFixed(2)}R`
        },
        avgRealizedRMultiple: {
          value: realizedRAvg,
          formatted: `${realizedRAvg.toFixed(2)}R`
        },
        // Time-based KPIs (MetricCard will format minutes into h/m)
        avgHoldTime: {
          value: reactiveAvgHoldMinutes ?? localAvgHoldMinutes,
          formatted: undefined
        },
        longestTradeDuration: {
          value: reactiveLongestMinutes ?? localLongestMinutes,
          formatted: undefined
        },
        avgTradingDaysDuration: {
          value: avgTradingDayMinutes,
          formatted: undefined
        }
      },
      charts: {
        avgPlannedRMultiple: {
          ...base.charts.avgPlannedRMultiple,
          // Prefer reactive R-multiple; otherwise use local fallback; otherwise base
          data: mappedPlannedR.length ? mappedPlannedR : (fallbackPlannedR.length ? fallbackPlannedR : base.charts.avgPlannedRMultiple.data),
          timeframe: 'Day'
        },
        avgLoss: {
          title: 'Cumulative P&L',
          data: mappedCum.length ? mappedCum : base.charts.avgLoss.data,
          color: base.charts.avgLoss.color,
          timeframe: 'Day'
        }
      }
    }
  }, [data, performanceData, dailyPnLReactive, cumulativePnLReactive, plannedRMultipleReactive, realizedRMultipleReactive])

  // Dynamic data provider for PerformanceChart metric switching
  const onDataRequest = useCallback(async (metric: string) => {
    // Map UI metric names to reactive chart types
    const name = metric.toLowerCase()
    let chartType: string | null = null

    if (name.includes('net account balance')) {
      chartType = 'Net account balance'
    } else if (name.includes('cumulative p&l') || name.includes('equity')) {
      chartType = 'equityCurve' // smoother alias of cumulative
    } else if (name.includes('avg daily net p&l') || name.includes('daily net p&l')) {
      chartType = 'dailyPnL'
    } else if (name.includes('avg daily net drawdown') || name.includes('daily net drawdown') || name.includes('max daily net drawdown')) {
      chartType = 'dailyDrawdown'
    } else if (name.includes('cumulative') || name.includes('p&l - cumulative')) {
      chartType = 'cumulativePnL'
    } else if (name.includes('volume')) {
      chartType = 'dailyVolume'
    } else if (name.includes('trade count') || name.includes('# of trades') || name.includes('trades per day')) {
      chartType = 'dailyTradeCount'
    } else if (name.includes('active days') || name.includes('logged days')) {
      chartType = 'dailyActiveDays'
    } else if (
      // General win rate time-series
      name.includes('win rate over time') ||
      name.includes('win % over time') ||
      name === 'win %' ||
      name === 'win%' ||
      name.includes('win%') ||
      name.includes('avg daily win%') ||
      name.includes('avg daily win %') ||
      // fallback: any phrase with both 'avg' and win percent
      (name.includes('avg') && (name.includes('win %') || name.includes('win%')))
    ) {
      chartType = 'winRateOverTime'
    } else if (
      name.includes('longs win') ||
      name.includes('long win rate') ||
      name.includes('long win%') ||
      name.includes('long win %') ||
      name.includes('long win')
    ) {
      chartType = 'longWinRateOverTime'
    } else if (
      name.includes('shorts win') ||
      name.includes('short win rate') ||
      name.includes('short win%') ||
      name.includes('short win %') ||
      name.includes('short win')
    ) {
      chartType = 'shortWinRateOverTime'
    } else if (name.includes('avg win')) {
      chartType = 'dailyAvgWin'
    } else if (name.includes('profit factor')) {
      chartType = 'profitFactorOverTime'
    } else if (name.includes('expectancy')) {
      chartType = 'expectancyOverTime'
    } else if (
      name.includes('avg daily win/loss') ||
      name.includes('avg win/loss') ||
      name.includes('avg net trade p&l') ||
      name.includes('avg trade p&l')
    ) {
      // Prefer the composite avg win-loss if explicitly asked, else fall back to avg net trade P&L
      chartType = name.includes('win/loss') ? 'dailyAvgWinLoss' : 'dailyAvgNetTradePnl'
    } else if (
      name.includes('max consecutive winning days') ||
      name.includes('longest winning days streak')
    ) {
      chartType = 'maxConsecutiveWinningDaysOverTime'
    } else if (
      name.includes('max consecutive losing days') ||
      name.includes('longest losing days streak')
    ) {
      chartType = 'maxConsecutiveLosingDaysOverTime'
    } else if (
      name.includes('max consecutive wins') ||
      name.includes('longest wins streak')
    ) {
      chartType = 'maxConsecutiveWinsOverTime'
    } else if (
      name.includes('max consecutive losses') ||
      name.includes('longest losses streak')
    ) {
      chartType = 'maxConsecutiveLossesOverTime'
    } else if (name.includes('breakeven days') || name.includes('breakeven days over time')) {
      chartType = 'dailyBreakevenDays'
    } else if (name.includes('breakeven trades') || name.includes('breakeven trades over time')) {
      chartType = 'dailyBreakevenTrades'
    } else if (name.includes('long trades')) {
      chartType = 'dailyLongTrades'
    } else if (name.includes('short trades')) {
      chartType = 'dailyShortTrades'
    } else if (
      // Long winning trades variants
      (name.includes('long') && name.includes('winning') && name.includes('trades')) ||
      name.includes('long winning trades')
    ) {
      chartType = 'dailyLongWinningTrades'
    } else if (
      // Short winning trades variants
      (name.includes('short') && name.includes('winning') && name.includes('trades')) ||
      name.includes('short winning trades')
    ) {
      chartType = 'dailyShortWinningTrades'
    } else if (
      // Long losing trades variants
      (name.includes('long') && name.includes('losing') && name.includes('trades')) ||
      name.includes('long losing trades')
    ) {
      chartType = 'dailyLongLosingTrades'
    } else if (
      // Short losing trades variants
      (name.includes('short') && name.includes('losing') && name.includes('trades')) ||
      name.includes('short losing trades')
    ) {
      chartType = 'dailyShortLosingTrades'
    } else if (
      name.includes('avg hold time') ||
      name.includes('avg trade duration') ||
      name.includes('average trading days duration') ||
      name.includes('avg trading days duration')
    ) {
      chartType = 'dailyAvgHoldTimeHours'
    } else if (
      name.includes('max hold time') ||
      name.includes('longest trade duration') ||
      name.includes('max trading days duration')
    ) {
      chartType = 'dailyMaxHoldTimeHours'
    } else if (name.includes('planned r-multiple') || name.includes('planned r multiple')) {
      chartType = 'plannedRMultipleOverTime'
    } else if (name.includes('realized r-multiple') || name.includes('realized r multiple')) {
      chartType = 'realizedRMultipleOverTime'
    } else if (name.includes('profit factor')) {
      chartType = 'profitFactorOverTime'
    } else if (name.includes('expectancy')) {
      chartType = 'expectancyOverTime'
    } else if (name.includes('avg daily win/loss') || name.includes('avg net trade p&l') || name.includes('avg trade p&l')) {
      chartType = 'dailyAvgNetTradePnl'
    }

    if (!chartType) {
      return { title: metric, data: [] }
    }

    const config = chartType === 'Net account balance' 
      ? { startingBalance: DataStore.getStartingBalance() }
      : undefined
    const series = await getChartData(chartType, config)

    // Normalize to { date, value }
    const mapped = (series || []).map((d: any) => {
      if ('pnl' in d) return { date: d.date, value: d.pnl }
      if ('cumulative' in d) return { date: d.date, value: d.cumulative }
      if ('equity' in d) return { date: d.date, value: d.equity }
      if ('drawdown' in d) return { date: d.date, value: d.drawdown }
      if ('value' in d) return { date: d.date, value: d.value }
      return { date: d.date ?? '', value: 0 }
    })

    return { title: metric, data: mapped }
  }, [getChartData])

  const getSummaryMetrics = () => [
    { label: 'Net P&L', value: actualData.metrics.netPnL, hasTooltip: true },
    { label: 'Trade expectancy', value: actualData.metrics.tradeExpectancy, hasTooltip: true },
    { label: 'Avg net trade P&L', value: actualData.metrics.avgNetTradePnL, hasTooltip: true },
    { label: 'Avg daily volume', value: actualData.metrics.avgDailyVolume, hasTooltip: true },
    { label: 'Win %', value: actualData.metrics.winRate, hasTooltip: true },
    { label: 'Avg daily win/loss', value: actualData.metrics.avgDailyWinLoss, hasTooltip: true },
    { label: 'Avg daily net P&L', value: actualData.metrics.avgDailyNetPnL, hasTooltip: true },
    { label: 'Logged days', value: actualData.metrics.loggedDays, hasTooltip: true },
    { label: 'Avg daily win %', value: actualData.metrics.avgDailyWinRate, hasTooltip: true },
    { label: 'Avg trade win/loss', value: actualData.metrics.avgTradeWinLoss, hasTooltip: true },
    { label: 'Avg. planned r-multiple', value: actualData.metrics.avgPlannedRMultiple, hasTooltip: true },
    { label: 'Max daily net drawdown', value: actualData.metrics.maxDailyNetDrawdown, hasTooltip: true },
    { label: 'Profit factor', value: actualData.metrics.profitFactor, hasTooltip: true },
    { label: 'Avg hold time', value: actualData.metrics.avgHoldTime, hasTooltip: true },
    { label: 'Avg. realized r-multiple', value: actualData.metrics.avgRealizedRMultiple, hasTooltip: true },
    { label: 'Avg net drawdown', value: actualData.metrics.avgNetDrawdown, hasTooltip: true }
  ]

  const getDaysMetrics = () => [
    { label: 'Avg daily win %', value: actualData.metrics.avgDailyWinRate, hasTooltip: true },
    { label: 'Avg daily win/loss', value: actualData.metrics.avgDailyWinLoss, hasTooltip: true },
    { label: 'Largest profitable day', value: actualData.metrics.largestProfitableDay, hasTooltip: true, hasExternalLink: true },
    { label: 'Avg daily net P&L', value: actualData.metrics.avgDailyNetPnL, hasTooltip: true },
    { label: 'Largest losing day', value: actualData.metrics.largestLosingDay, hasTooltip: true, hasExternalLink: true },
    { label: 'Average trading days duration', value: actualData.metrics.avgTradingDaysDuration, hasTooltip: true }
  ]

  const getTradesMetrics = () => [
    { label: 'Win %', value: actualData.metrics.winRate, hasTooltip: true },
    { label: 'Avg trade win/loss', value: actualData.metrics.avgTradeWinLoss, hasTooltip: true },
    { label: 'Largest profitable trade', value: actualData.metrics.largestProfitableTrade, hasTooltip: true, hasExternalLink: true },
    { label: 'Longest trade duration', value: actualData.metrics.longestTradeDuration, hasTooltip: true },
    { label: 'Longs win %', value: actualData.metrics.longsWinRate, hasTooltip: true },
    { label: 'Trade expectancy', value: actualData.metrics.tradeExpectancy, hasTooltip: true },
    { label: 'Largest losing trade', value: actualData.metrics.largestLosingTrade, hasTooltip: true, hasExternalLink: true },
    { label: 'Shorts win %', value: actualData.metrics.shortsWinRate, hasTooltip: true },
    { label: 'Avg net trade P&L', value: actualData.metrics.avgNetTradePnL, hasTooltip: true },
    { label: 'Average trading days duration', value: actualData.metrics.avgTradingDaysDuration, hasTooltip: true }
  ]

  const getCurrentMetrics = () => {
    switch (activeTab) {
      case 'Days':
        return getDaysMetrics()
      case 'Trades':
        return getTradesMetrics()
      default:
        return getSummaryMetrics()
    }
  }

  const getMetricColumns = () => {
    switch (activeTab) {
      case 'Days':
        return 3
      case 'Trades':
        return 5
      default:
        return 4
    }
  }

  const showZellaScale = () => activeTab === 'Days' || activeTab === 'Trades'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Loading performance data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-red-600 dark:text-red-400">Error loading performance data: {error}</div>
      </div>
    )
  }

  // Always render the full page structure, even without data

  return (
    <div className="space-y-6">
      {!trades?.length && (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No trading data available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Import your CSV file to view performance analytics and insights
          </p>
          <button 
            onClick={() => window.location.href = '/import-data'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import Trading Data
          </button>
        </div>
      )}
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={actualData.charts.avgPlannedRMultiple} onDataRequest={onDataRequest} />
        <PerformanceChart data={actualData.charts.avgLoss} onDataRequest={onDataRequest} />
      </div>

      {/* Tabs */}
      <PerformanceTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      {/* Metrics Section */}
      <MetricGrid 
        metrics={getCurrentMetrics()} 
        columns={getMetricColumns()}
        zellaScale={showZellaScale() ? actualData.metrics.zellaScale : undefined}
      />
    </div>
  )
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}