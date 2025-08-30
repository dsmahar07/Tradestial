/**
 * Reactive analytics data store with real-time subscriptions
 * Provides automatic recalculation and UI updates when data or filters change
 */

import { Trade, TradeMetrics } from './trade-data.service'
import { AnalyticsFilter, AnalyticsFilterService, FilterResult, AggregationConfig, AggregationResult } from './analytics-filter.service'
import { AnalyticsCacheService } from './analytics-cache.service'
import TradeMetadataService from './trade-metadata.service'
import { calculateTradeRMultiple, calculateRMultipleMetrics, calculateRMultipleExpectancy } from '@/utils/r-multiple'

export interface AnalyticsState {
  // Core data
  trades: Trade[]
  filteredTrades: Trade[]
  
  // Current filters and config
  activeFilters: AnalyticsFilter
  aggregationConfig: AggregationConfig | null
  
  // Calculated results
  metrics: TradeMetrics | null
  aggregationResults: AggregationResult | null
  chartData: Record<string, any[]>
  
  // UI state
  loading: boolean
  error: string | null
  lastUpdated: number
  
  // Performance metrics
  calculationTime: number
  filterTime: number
  cacheHitRate: number
}

export interface Subscription {
  id: string
  callback: (state: AnalyticsState) => void
  filter?: (state: AnalyticsState) => boolean // Optional filter for selective updates
  debounceMs?: number
}

export interface AnalyticsEvent {
  type: 'DATA_UPDATED' | 'FILTER_CHANGED' | 'AGGREGATION_CHANGED' | 'CALCULATION_COMPLETE' | 'ERROR'
  timestamp: number
  payload?: any
  source?: string
}

export interface ReactiveConfig {
  enableCache: boolean
  cacheConfig?: any
  debounceMs: number
  batchUpdates: boolean
  maxConcurrentCalculations: number
  enableWorkers: boolean
  debug?: boolean
}

export class ReactiveAnalyticsService {
  private static instance: ReactiveAnalyticsService | null = null
  private state: AnalyticsState
  private subscriptions: Map<string, Subscription> = new Map()
  private eventHistory: AnalyticsEvent[] = []
  private config: ReactiveConfig
  private calculationQueue: Array<() => Promise<void>> = []
  private activeCalculations = 0
  private updateTimer: NodeJS.Timeout | null = null
  private totalQueued = 0
  private totalProcessed = 0

  private constructor(config: ReactiveConfig) {
    this.config = config
    this.state = this.getInitialState()
    
    if (config.enableCache) {
      AnalyticsCacheService.initialize(config.cacheConfig)
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: ReactiveConfig): ReactiveAnalyticsService {
    if (!this.instance) {
      const defaultConfig: ReactiveConfig = {
        enableCache: true,
        debounceMs: 300,
        batchUpdates: true,
        maxConcurrentCalculations: 3,
        enableWorkers: false,
        debug: false
      }
      this.instance = new ReactiveAnalyticsService({ ...defaultConfig, ...config })
    }
    return this.instance
  }

  /**
   * Subscribe to state changes
   */
  subscribe(
    callback: (state: AnalyticsState) => void,
    options?: {
      filter?: (state: AnalyticsState) => boolean
      debounceMs?: number
      immediate?: boolean
    }
  ): () => void {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const subscription: Subscription = {
      id,
      callback,
      filter: options?.filter,
      debounceMs: options?.debounceMs || this.config.debounceMs
    }

    this.subscriptions.set(id, subscription)

    // Call immediately if requested
    if (options?.immediate) {
      callback(this.state)
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(id)
    }
  }

  /**
   * Get current state
   */
  getState(): AnalyticsState {
    return { ...this.state }
  }

  /**
   * Update trades data
   */
  async updateTrades(trades: Trade[]): Promise<void> {
    this.emitEvent({ type: 'DATA_UPDATED', timestamp: Date.now(), payload: { count: trades.length } })
    
    this.setState({
      ...this.state,
      trades: [...trades],
      loading: true,
      lastUpdated: Date.now(),
      error: null
    })

    // Invalidate cache for trade-related calculations
    if (this.config.enableCache) {
      AnalyticsCacheService.invalidate('trades:*')
    }

    await this.recalculateAll()
  }

  /**
   * Update active filters
   */
  async updateFilters(filters: AnalyticsFilter): Promise<void> {
    this.emitEvent({ type: 'FILTER_CHANGED', timestamp: Date.now(), payload: filters })
    
    this.setState({
      ...this.state,
      activeFilters: { ...filters },
      loading: true,
      error: null
    })

    await this.recalculateFiltered()
  }

  /**
   * Update aggregation configuration
   */
  async updateAggregationConfig(config: AggregationConfig): Promise<void> {
    this.emitEvent({ type: 'AGGREGATION_CHANGED', timestamp: Date.now(), payload: config })
    
    this.setState({
      ...this.state,
      aggregationConfig: { ...config },
      loading: true,
      error: null
    })

    await this.recalculateAggregations()
  }

  /**
   * Get specific chart data with caching
   */
  async getChartData(chartType: string, config?: any): Promise<any[]> {
    // Bump cache version for specific chart types when data model changes
    const dataVersion = chartType === 'cumulativePnL' ? 'v2-per-trade' : 'v1'
    const cacheKey = AnalyticsCacheService.generateCacheKey('chart', {
      chartType,
      dataVersion,
      filter: this.state.activeFilters,
      tradeCount: this.state.trades.length,
      customId: JSON.stringify(config)
    })

    if (this.config.enableCache) {
      const cached = await AnalyticsCacheService.get<any[]>(cacheKey)
      if (cached) {
        if (this.config.debug) console.debug('[ReactiveAnalytics] Cache hit for chart', { chartType, key: cacheKey })
        return cached
      }
    }

    // Calculate chart data based on current filtered trades
    const t0 = performance.now()
    const chartData = await this.calculateChartData(chartType, this.state.filteredTrades, config)
    const dt = performance.now() - t0
    if (this.config.debug) console.debug('[ReactiveAnalytics] Chart calculated', { chartType, ms: dt, trades: this.state.filteredTrades.length })

    if (this.config.enableCache) {
      await AnalyticsCacheService.set(cacheKey, chartData, {
        dependencies: ['trades:*', 'filters:*'],
        ttl: 5 * 60 * 1000 // 5 minutes
      })
    }

    this.emitEvent({ type: 'CALCULATION_COMPLETE', timestamp: Date.now(), payload: { type: 'chart', chartType, time: dt } })
    return chartData
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    state: Pick<AnalyticsState, 'calculationTime' | 'filterTime' | 'cacheHitRate'>
    cache: any
    subscriptions: number
    eventHistory: number
  } {
    return {
      state: {
        calculationTime: this.state.calculationTime,
        filterTime: this.state.filterTime,
        cacheHitRate: this.state.cacheHitRate
      },
      cache: this.config.enableCache ? AnalyticsCacheService.getStats() : null,
      subscriptions: this.subscriptions.size,
      eventHistory: this.eventHistory.length
    }
  }

  /**
   * Clear all data and reset state
   */
  async reset(): Promise<void> {
    this.setState(this.getInitialState())
    
    if (this.config.enableCache) {
      AnalyticsCacheService.clear()
    }
    this.eventHistory = []
    await this.notifySubscribers()
  }

  /**
   * Wait for all data preparation to complete after CSV import
   */
  async waitForDataPreparation(): Promise<void> {
    const maxWaitTime = 30000 // 30 seconds timeout
    const idleStabilizeMs = 250 // allow brief stabilization after last progress
    const startTime = Date.now()
    let lastProgress = Date.now()
    let lastTotals = { queued: this.totalQueued, processed: this.totalProcessed }

    while (this.calculationQueue.length > 0 || this.activeCalculations > 0) {
      if (Date.now() - startTime > maxWaitTime) {
        console.warn('Data preparation timed out after 30 seconds')
        break
      }

      // progress detection
      if (this.totalQueued !== lastTotals.queued || this.totalProcessed !== lastTotals.processed) {
        lastTotals = { queued: this.totalQueued, processed: this.totalProcessed }
        lastProgress = Date.now()
        if (this.config.debug) console.debug('[ReactiveAnalytics] waitForDataPreparation progress', lastTotals)
      }

      // If we've been idle for a short window and no active/queued, exit early
      if (this.calculationQueue.length === 0 && this.activeCalculations === 0 && Date.now() - lastProgress >= idleStabilizeMs) {
        break
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Ensure all common chart data is pre-calculated
    const commonChartTypes = [
      'dailyPnL', 'cumulativePnL', 'equityCurve', 'dailyDrawdown',
      'symbolPerformance', 'hourlyPerformance', 'dailyVolume',
      'dailyTradeCount', 'winRateOverTime', 'dailyAvgWin',
      'dailyAvgLoss', 'profitFactorOverTime', 'expectancyOverTime'
    ]
    
    for (const chartType of commonChartTypes) {
      try {
        await this.getChartData(chartType)
      } catch (error) {
        console.warn(`Failed to pre-calculate ${chartType}:`, error)
      }
    }
  }

  // Group trades by YYYY-MM-DD of openDate, sorted by date asc
  private groupTradesByOpenDate(trades: Trade[]): Record<string, Trade[]> {
    const groups: Record<string, Trade[]> = {}
    for (const t of trades) {
      const date = (t.openDate || '').split('T')[0]
      if (!date) continue
      if (!groups[date]) groups[date] = []
      groups[date].push(t)
    }
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, k) => { acc[k] = groups[k]; return acc }, {} as Record<string, Trade[]>)
  }

  private toSeries(map: Record<string, number>): Array<{ date: string; value: number }> {
    return Object.entries(map).map(([date, value]) => ({ date, value }))
  }

  private calculateDailyVolume(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      result[date] = ts.reduce((sum, t) => sum + (t.contractsTraded ?? 1), 0)
    }
    return this.toSeries(result)
  }

  private calculateDailyTradeCount(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      result[date] = ts.length
    }
    return this.toSeries(result)
  }

  private calculateDailyActiveDays(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      result[date] = ts.length > 0 ? 1 : 0
    }
    return this.toSeries(result)
  }

  private calculateWinRateOverTime(trades: Trade[], side?: 'LONG' | 'SHORT'): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const filtered = side ? ts.filter(t => t.side === side) : ts
      const total = filtered.length
      const wins = filtered.filter(t => t.status === 'WIN').length
      result[date] = total > 0 ? (wins / total) * 100 : 0
    }
    return this.toSeries(result)
  }

  private calculateDailyAvgNetTradePnl(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      result[date] = ts.length > 0 ? ts.reduce((s, t) => s + t.netPnl, 0) / ts.length : 0
    }
    return this.toSeries(result)
  }

  private calculateDailyAvgWin(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const wins = ts.filter(t => t.status === 'WIN')
      const count = wins.length
      const total = wins.reduce((s, t) => s + t.netPnl, 0)
      result[date] = count > 0 ? total / count : 0
    }
    return this.toSeries(result)
  }

  private calculateDailyAvgLoss(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const losses = ts.filter(t => t.status === 'LOSS')
      const count = losses.length
      const totalAbs = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0))
      const avg = count > 0 ? totalAbs / count : 0
      // Represent losses as negative value for charting symmetry
      result[date] = avg > 0 ? -avg : 0
    }
    return this.toSeries(result)
  }

  private calculateDailyMaxWin(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const wins = ts.filter(t => t.netPnl > 0)
      result[date] = wins.length > 0 ? Math.max(...wins.map(t => t.netPnl)) : 0
    }
    return this.toSeries(result)
  }

  private calculateDailyMaxLoss(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const losses = ts.filter(t => t.netPnl < 0)
      result[date] = losses.length > 0 ? Math.min(...losses.map(t => t.netPnl)) : 0
    }
    return this.toSeries(result)
  }

  private calculateDailyBreakevenTrades(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const epsilon = 0.01
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      result[date] = ts.filter(t => Math.abs(t.netPnl) < epsilon).length
    }
    return this.toSeries(result)
  }

  private calculateDailyBreakevenDays(trades: Trade[]): Array<{ date: string; value: number }> {
    const daily = this.calculateDailyPnLData(trades)
    const epsilon = 0.01
    return daily.map(d => ({ date: d.date, value: Math.abs(d.pnl) < epsilon ? 1 : 0 }))
  }

  private calculateDailySideCounts(trades: Trade[], side: 'LONG' | 'SHORT'): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      result[date] = ts.filter(t => t.side === side).length
    }
    return this.toSeries(result)
  }

  private calculateDailySideStatusCounts(trades: Trade[], side: 'LONG' | 'SHORT', status: 'WIN' | 'LOSS'): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      result[date] = ts.filter(t => t.side === side && t.status === status).length
    }
    return this.toSeries(result)
  }

  private calculateDailyAvgHoldTimeHours(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const durations = ts.map(t => this.getTradeDurationHours(t)).filter(v => !isNaN(v))
      const avg = durations.length > 0 ? durations.reduce((s, v) => s + v, 0) / durations.length : 0
      result[date] = avg
    }
    return this.toSeries(result)
  }

  private calculateDailyMaxHoldTimeHours(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const durations = ts.map(t => this.getTradeDurationHours(t)).filter(v => !isNaN(v))
      const max = durations.length > 0 ? Math.max(...durations) : 0
      result[date] = max
    }
    return this.toSeries(result)
  }

  private getTradeDurationHours(trade: Trade): number {
    // Robustly build start/end datetimes with fallbacks
    const openIso = trade.openDate || ''
    const closeIso = trade.closeDate || trade.openDate || ''
    const openDateStr = openIso.split('T')[0]
    const closeDateStr = closeIso.split('T')[0]
    const entryTime = trade.entryTime || (trade as any).openTime || (trade as any).entry_time || ''
    const exitTime = trade.exitTime || (trade as any).closeTime || (trade as any).bestExitTime || (trade as any).exit_time || ''

    // Start: prefer explicit entryTime, else preserve timestamp from openDate if present
    let start: Date
    if (openDateStr && entryTime) start = new Date(`${openDateStr}T${entryTime}`)
    else if (openIso) start = new Date(openIso)
    else if (openDateStr) start = new Date(openDateStr)
    else start = new Date(0)

    // End: prefer explicit exitTime, else preserve timestamp from closeDate if present
    let end: Date
    if (closeDateStr && exitTime) end = new Date(`${closeDateStr}T${exitTime}`)
    else if (closeIso) end = new Date(closeIso)
    else if (closeDateStr) end = new Date(closeDateStr)
    else end = new Date(0)

    const ms = end.getTime() - start.getTime()
    const hours = ms / 3600000
    let safeHours = Number.isFinite(hours) && hours >= 0 ? hours : 0

    // Fallback: parse duration string if present and hours is zero
    if (safeHours === 0 && (trade as any).duration) {
      const parsed = this.parseDurationToHours(String((trade as any).duration))
      if (parsed > 0) safeHours = parsed
    }

    return safeHours
  }

  private parseDurationToHours(dur: string): number {
    const s = dur.trim().toUpperCase()
    // ISO8601 like PT1H30M45S
    const iso = /^P(T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)$/
    const mIso = s.match(iso)
    if (mIso) {
      const h = parseFloat(mIso[2] || '0')
      const m = parseFloat(mIso[3] || '0')
      const sec = parseFloat(mIso[4] || '0')
      return h + m / 60 + sec / 3600
    }
    // HH:MM or HH:MM:SS
    const hm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    const mHm = s.match(hm)
    if (mHm) {
      const h = parseFloat(mHm[1] || '0')
      const m = parseFloat(mHm[2] || '0')
      const sec = parseFloat(mHm[3] || '0')
      return h + m / 60 + sec / 3600
    }
    // e.g., '1H 20M', '90M', '45S'
    let total = 0
    const hMatch = s.match(/(\d+(?:\.\d+)?)\s*H/)
    const mMatch = s.match(/(\d+(?:\.\d+)?)\s*M/)
    const sMatch = s.match(/(\d+(?:\.\d+)?)\s*S/)
    if (hMatch) total += parseFloat(hMatch[1])
    if (mMatch) total += parseFloat(mMatch[1]) / 60
    if (sMatch) total += parseFloat(sMatch[1]) / 3600
    if (total > 0) return total
    // plain minutes like '90' or '90m'
    const plainMin = s.match(/^(\d+(?:\.\d+)?)(?:\s*M)?$/)
    if (plainMin) return parseFloat(plainMin[1]) / 60
    return 0
  }

  private calculatePlannedRMultipleOverTime(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const vals: number[] = []
      for (const t of ts) {
        const metadata = TradeMetadataService.getTradeMetadata(t.id)
        const { plannedRMultiple } = calculateTradeRMultiple(t, metadata || undefined)
        if (plannedRMultiple !== null && !isNaN(plannedRMultiple)) {
          vals.push(plannedRMultiple)
        }
      }
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
      result[date] = avg
    }
    return this.toSeries(result)
  }

  private calculateRealizedRMultipleOverTime(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const vals: number[] = []
      for (const t of ts) {
        const metadata = TradeMetadataService.getTradeMetadata(t.id)
        const { realizedRMultiple } = calculateTradeRMultiple(t, metadata || undefined)
        if (realizedRMultiple !== null && !isNaN(realizedRMultiple)) {
          vals.push(realizedRMultiple)
        }
      }
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
      result[date] = avg
    }
    return this.toSeries(result)
  }

  private calculateProfitFactorOverTime(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const wins = ts.filter(t => t.netPnl > 0)
      const losses = ts.filter(t => t.netPnl < 0)
      const totalWin = wins.reduce((s, t) => s + t.netPnl, 0)
      const totalLossAbs = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0))
      result[date] = totalLossAbs > 0 ? totalWin / totalLossAbs : 0
    }
    return this.toSeries(result)
  }

  private calculateExpectancyOverTime(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const total = ts.length
      if (total === 0) { result[date] = 0; continue }
      const wins = ts.filter(t => t.status === 'WIN')
      const losses = ts.filter(t => t.status === 'LOSS')
      const pWin = wins.length / total
      const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.netPnl, 0) / wins.length : 0
      const avgLossAbs = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.netPnl, 0)) / losses.length : 0
      const pLoss = 1 - pWin
      result[date] = pWin * avgWin - pLoss * avgLossAbs
    }
    return this.toSeries(result)
  }

  /**
   * Batch multiple operations for better performance
   */
  async batch(operations: Array<() => Promise<void>>): Promise<void> {
    this.setState({ ...this.state, loading: true })
    
    try {
      await Promise.all(operations.map(op => op()))
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Export current state for debugging or persistence
   */
  exportState(): {
    state: AnalyticsState
    config: ReactiveConfig
    subscriptions: number
    eventHistory: AnalyticsEvent[]
  } {
    return {
      state: this.getState(),
      config: this.config,
      subscriptions: this.subscriptions.size,
      eventHistory: [...this.eventHistory]
    }
  }

  // Private methods

  private getInitialState(): AnalyticsState {
    return {
      trades: [],
      filteredTrades: [],
      activeFilters: {},
      aggregationConfig: null,
      metrics: null,
      aggregationResults: null,
      chartData: {},
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      calculationTime: 0,
      filterTime: 0,
      cacheHitRate: 0
    }
  }

  private setState(newState: AnalyticsState): void {
    this.state = newState
    this.scheduleNotification()
  }

  private scheduleNotification(): void {
    if (!this.config.batchUpdates) {
      this.notifySubscribers()
      return
    }

    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }

    this.updateTimer = setTimeout(() => {
      this.notifySubscribers()
      this.updateTimer = null
    }, this.config.debounceMs)
  }

  private async notifySubscribers(): Promise<void> {
    const state = this.getState()
    
    for (const subscription of this.subscriptions.values()) {
      try {
        // Apply filter if specified
        if (subscription.filter && !subscription.filter(state)) {
          continue
        }

        subscription.callback(state)
      } catch (error) {
        console.error('Subscription callback error:', error)
      }
    }
  }

  private async recalculateAll(): Promise<void> {
    // Do not wrap this in queueCalculation to avoid nested queue deadlocks.
    // Each called method already enqueues its own calculation work.
    // Be resilient to timeouts/errors in individual steps; continue to next.
    try {
      await this.recalculateFiltered()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (this.config.debug) console.error('[ReactiveAnalytics] recalculateFiltered failed in recalculateAll', message)
      this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'filter', message } })
    }

    try {
      await this.recalculateMetrics()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (this.config.debug) console.error('[ReactiveAnalytics] recalculateMetrics failed in recalculateAll', message)
      this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'metrics', message } })
    }

    try {
      await this.recalculateAggregations()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (this.config.debug) console.error('[ReactiveAnalytics] recalculateAggregations failed in recalculateAll', message)
      this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'aggregations', message } })
    }

    try {
      await this.recalculateChartData()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (this.config.debug) console.error('[ReactiveAnalytics] recalculateChartData failed in recalculateAll', message)
      this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'charts', message } })
    }
  }

  private async recalculateFiltered(): Promise<void> {
    await this.queueCalculation(async () => {
      const startTime = performance.now()
      try {
        const cacheKey = AnalyticsCacheService.generateCacheKey('filter', {
          filter: this.state.activeFilters,
          tradeCount: this.state.trades.length
        })

        let filterResult: FilterResult

        if (this.config.enableCache) {
          const cached = await AnalyticsCacheService.get<FilterResult>(cacheKey)
          if (cached) {
            filterResult = cached
          } else {
            filterResult = AnalyticsFilterService.filterTrades(this.state.trades, this.state.activeFilters)
            await AnalyticsCacheService.set(cacheKey, filterResult, {
              dependencies: ['trades:*'],
              ttl: 5 * 60 * 1000
            })
          }
        } else {
          filterResult = AnalyticsFilterService.filterTrades(this.state.trades, this.state.activeFilters)
        }

        const filterTime = performance.now() - startTime

        this.setState({
          ...this.state,
          filteredTrades: filterResult.trades,
          filterTime,
          loading: false,
          error: null
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to filter trades'
        if (this.config.debug) console.error('[ReactiveAnalytics] Filter step failed', error)
        this.setState({
          ...this.state,
          loading: false,
          error: message
        })
        this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'filter', message } })
      }
    })
  }

  private async recalculateMetrics(): Promise<void> {
    await this.queueCalculation(async () => {
      try {
        const startTime = performance.now()
        
        const cacheKey = AnalyticsCacheService.generateCacheKey('kpi', {
          filter: this.state.activeFilters,
          tradeCount: this.state.filteredTrades.length,
          customId: 'metrics'
        })

        let metrics: TradeMetrics

        if (this.config.enableCache) {
          const cached = await AnalyticsCacheService.get<TradeMetrics>(cacheKey)
          if (cached) {
            metrics = cached
          } else {
            metrics = this.calculateMetrics(this.state.filteredTrades)
            await AnalyticsCacheService.set(cacheKey, metrics, {
              dependencies: ['trades:*', 'filters:*'],
              ttl: 5 * 60 * 1000
            })
          }
        } else {
          metrics = this.calculateMetrics(this.state.filteredTrades)
        }

        const calculationTime = performance.now() - startTime

        this.setState({
          ...this.state,
          metrics,
          calculationTime,
          error: null
        })

        this.emitEvent({ 
          type: 'CALCULATION_COMPLETE', 
          timestamp: Date.now(), 
          payload: { type: 'metrics', time: calculationTime } 
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to calculate metrics'
        if (this.config.debug) console.error('[ReactiveAnalytics] Metrics step failed', error)
        this.setState({
          ...this.state,
          error: message
        })
        this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'metrics', message } })
      }
    })
  }

  private async recalculateAggregations(): Promise<void> {
    if (!this.state.aggregationConfig) return

    await this.queueCalculation(async () => {
      try {
        const t0 = performance.now()
        const aggregationResults = AnalyticsFilterService.aggregateData(
          this.state.filteredTrades,
          this.state.aggregationConfig!
        )

        this.setState({
          ...this.state,
          aggregationResults,
          error: null
        })

        const dt = performance.now() - t0
        this.emitEvent({ 
          type: 'CALCULATION_COMPLETE', 
          timestamp: Date.now(), 
          payload: { type: 'aggregations', time: dt } 
        })
        if (this.config.debug) console.debug('[ReactiveAnalytics] Aggregations recalculated', { ms: dt })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to calculate aggregations'
        if (this.config.debug) console.error('[ReactiveAnalytics] Aggregations step failed', error)
        this.setState({
          ...this.state,
          error: message
        })
        this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'aggregations', message } })
      }
    })
  }

  private async recalculateChartData(): Promise<void> {
    await this.queueCalculation(async () => {
      try {
        const chartData: Record<string, any[]> = {}
        const t0 = performance.now()

        // Calculate common chart data types and extended advanced series
        const chartTypes = [
        'dailyPnL',
        'cumulativePnL',
        'equityCurve',
        'dailyDrawdown',
        'symbolPerformance',
        'hourlyPerformance',
        // Activity & Volume
        'dailyVolume',
        'dailyTradeCount',
        'dailyActiveDays',
        // Win rates
        'winRateOverTime',
        'longWinRateOverTime',
        'shortWinRateOverTime',
        // PnL stats
        'dailyAvgWin',
        'dailyAvgLoss',
        'dailyAvgWinLoss',
        'dailyAvgNetTradePnl',
        'dailyMaxWin',
        'dailyMaxLoss',
        // Breakeven
        'dailyBreakevenTrades',
        'dailyBreakevenDays',
        // Streaks & consistency
        'maxConsecutiveWinningDaysOverTime',
        'maxConsecutiveLosingDaysOverTime',
        'maxConsecutiveWinsOverTime',
        'maxConsecutiveLossesOverTime',
        // Risk/return metrics
        'profitFactorOverTime',
        'expectancyOverTime',
        'plannedRMultipleOverTime',
        'realizedRMultipleOverTime'
      ]

        // Per-series timeout and limited concurrency to avoid long tail blocking
        const SERIES_TIMEOUT_MS = 8000
        const SERIES_CONCURRENCY = 4
        const trades = this.state.filteredTrades

        const withTimeout = async <T>(p: Promise<T>, ms: number, label: string): Promise<T> => {
          let timer: any
          return Promise.race([
            p.finally(() => timer && clearTimeout(timer)),
            new Promise<T>((_, reject) => {
              timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
            })
          ])
        }

        let index = 0
        const workers: Array<Promise<void>> = []
        const worker = async () => {
          while (true) {
            const myIdx = index++
            if (myIdx >= chartTypes.length) break
            const chartType = chartTypes[myIdx]
            const start = performance.now()
            try {
              const data = await withTimeout(
                this.calculateChartData(chartType, trades),
                SERIES_TIMEOUT_MS,
                `Chart series: ${chartType}`
              )
              chartData[chartType] = data
              const dt = performance.now() - start
              if (this.config.debug) console.debug('[ReactiveAnalytics] Series calculated', { chartType, ms: dt, points: Array.isArray(data) ? data.length : 0 })
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err)
              chartData[chartType] = []
              if (this.config.debug) console.error('[ReactiveAnalytics] Series failed', { chartType, error: message })
              this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'chart-series', chartType, message } })
            }
          }
        }

        for (let i = 0; i < SERIES_CONCURRENCY; i++) workers.push(worker())
        await Promise.all(workers)

        this.setState({
          ...this.state,
          chartData,
          error: null
        })

        const dt = performance.now() - t0
        this.emitEvent({ 
          type: 'CALCULATION_COMPLETE', 
          timestamp: Date.now(), 
          payload: { type: 'all-charts', time: dt } 
        })
        if (this.config.debug) console.debug('[ReactiveAnalytics] All charts recalculated', { ms: dt, series: Object.keys(chartData).length })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to calculate chart data'
        if (this.config.debug) console.error('[ReactiveAnalytics] Chart data step failed', error)
        this.setState({
          ...this.state,
          error: message
        })
        this.emitEvent({ type: 'ERROR', timestamp: Date.now(), payload: { stage: 'charts', message } })
      }
    })
  }

  private async queueCalculation(calculation: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.totalQueued++
      this.calculationQueue.push(async () => {
        try {
          this.activeCalculations++
          if (this.config.debug) console.debug('[ReactiveAnalytics] Calculation start', { active: this.activeCalculations, queued: this.calculationQueue.length })
          const t0 = performance.now()
          // Safety timeout to prevent indefinite hangs
          const TIMEOUT_MS = 20000
          let timer: any
          try {
            await Promise.race([
              calculation(),
              new Promise<void>((_, rej) => { timer = setTimeout(() => rej(new Error('Calculation timed out')), TIMEOUT_MS) })
            ])
          } finally {
            if (timer) clearTimeout(timer)
          }
          const dt = performance.now() - t0
          if (this.config.debug) console.debug('[ReactiveAnalytics] Calculation finished', { ms: dt })
          resolve()
        } catch (error) {
          reject(error)
        } finally {
          this.activeCalculations--
          this.totalProcessed++
          if (this.config.debug) console.debug('[ReactiveAnalytics] Calculation finalize', { active: this.activeCalculations, queued: this.calculationQueue.length, totalProcessed: this.totalProcessed })
          this.processCalculationQueue()
        }
      })

      this.processCalculationQueue()
    })
  }

  private processCalculationQueue(): void {
    if (this.activeCalculations >= this.config.maxConcurrentCalculations || this.calculationQueue.length === 0) {
      return
    }

    const nextCalculation = this.calculationQueue.shift()
    if (nextCalculation) {
      if (this.config.debug) console.debug('[ReactiveAnalytics] Dispatching calculation', { active: this.activeCalculations, remaining: this.calculationQueue.length })
      nextCalculation()
    }
  }

  // Lightweight status for debugging UI/console
  getProcessingStatus(): { queueLength: number; activeCalculations: number; totalQueued: number; totalProcessed: number; lastUpdated: number; loading: boolean } {
    return {
      queueLength: this.calculationQueue.length,
      activeCalculations: this.activeCalculations,
      totalQueued: this.totalQueued,
      totalProcessed: this.totalProcessed,
      lastUpdated: this.state.lastUpdated,
      loading: this.state.loading
    }
  }

  private calculateMetrics(trades: Trade[]): TradeMetrics {
    // Align with TradeDataService.calculateMetrics and include R-Multiple metrics
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        netCumulativePnl: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgWinAmount: 0,
        avgLossAmount: 0,
        profitFactor: 0,
        totalWinAmount: 0,
        totalLossAmount: 0,
        grossPnl: 0,
        totalCommissions: 0,
        avgRoi: 0,
        maxWin: 0,
        maxLoss: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        avgTradeDuration: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        profitabilityIndex: 0,
        riskRewardRatio: 0,
        expectancy: 0,
        avgPlannedRMultiple: 0,
        avgRealizedRMultiple: 0,
        rMultipleExpectancy: 0,
        tradesWithValidSLTP: 0
      }
    }

    const totalTrades = trades.length
    const netCumulativePnl = trades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const winningTrades = trades.filter(trade => trade.status === 'WIN').length
    const losingTrades = trades.filter(trade => trade.status === 'LOSS').length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    const winTrades = trades.filter(trade => trade.status === 'WIN')
    const lossTrades = trades.filter(trade => trade.status === 'LOSS')
    const totalWinAmount = winTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const totalLossAmount = Math.abs(lossTrades.reduce((sum, trade) => sum + trade.netPnl, 0))

    const avgWinAmount = winningTrades > 0 ? totalWinAmount / winningTrades : 0
    const avgLossAmount = losingTrades > 0 ? totalLossAmount / losingTrades : 0
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0

    const grossPnl = trades.reduce((sum, trade) => sum + (trade.grossPnl || trade.netPnl), 0)
    const totalCommissions = trades.reduce((sum, trade) => sum + (trade.commissions || 0), 0)
    const avgRoi = trades.reduce((sum, trade) => sum + trade.netRoi, 0) / totalTrades

    const maxWin = winTrades.length > 0 ? Math.max(...winTrades.map(t => t.netPnl)) : 0
    const maxLoss = lossTrades.length > 0 ? Math.min(...lossTrades.map(t => t.netPnl)) : 0

    // Streaks
    let currentWinStreak = 0
    let currentLossStreak = 0
    let consecutiveWins = 0
    let consecutiveLosses = 0
    trades.forEach(t => {
      if (t.status === 'WIN') {
        currentWinStreak++
        currentLossStreak = 0
        if (currentWinStreak > consecutiveWins) consecutiveWins = currentWinStreak
      } else {
        currentLossStreak++
        currentWinStreak = 0
        if (currentLossStreak > consecutiveLosses) consecutiveLosses = currentLossStreak
      }
    })

    // Drawdown
    let runningPnl = 0
    let peak = 0
    let maxDrawdown = 0
    trades.forEach(trade => {
      runningPnl += trade.netPnl
      peak = Math.max(peak, runningPnl)
      const dd = peak - runningPnl
      maxDrawdown = Math.max(maxDrawdown, dd)
    })

    const avgTradeDuration = 0
    const sharpeRatio = 0
    const profitabilityIndex = winRate / 100
    const riskRewardRatio = avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0
    const expectancy = (winRate / 100) * avgWinAmount - ((100 - winRate) / 100) * avgLossAmount

    // R-Multiple metrics using per-trade metadata
    const getTradeMetadata = (tradeId: string) => TradeMetadataService.getTradeMetadata(tradeId)
    const rMultipleMetrics = calculateRMultipleMetrics(trades, getTradeMetadata)
    const rMultipleExpectancyData = calculateRMultipleExpectancy(trades, getTradeMetadata)

    return {
      totalTrades,
      netCumulativePnl,
      winningTrades,
      losingTrades,
      winRate,
      avgWinAmount,
      avgLossAmount,
      profitFactor,
      totalWinAmount,
      totalLossAmount,
      grossPnl,
      totalCommissions,
      avgRoi,
      maxWin,
      maxLoss,
      consecutiveWins,
      consecutiveLosses,
      avgTradeDuration,
      sharpeRatio,
      maxDrawdown,
      profitabilityIndex,
      riskRewardRatio,
      expectancy,
      avgPlannedRMultiple: rMultipleMetrics.avgPlannedRMultiple,
      avgRealizedRMultiple: rMultipleMetrics.avgRealizedRMultiple,
      rMultipleExpectancy: rMultipleExpectancyData.expectancy,
      tradesWithValidSLTP: rMultipleMetrics.tradesWithValidSLTP
    }
  }

  private async calculateChartData(chartType: string, trades: Trade[], config?: any): Promise<any[]> {
    switch (chartType) {
      case 'dailyPnL':
        return this.calculateDailyPnLData(trades) as any
      case 'cumulativePnL':
        return this.calculateCumulativePnLData(trades) as any
      case 'equityCurve':
        return this.calculateEquityCurveData(trades) as any
      case 'Net account balance':
        return this.calculateNetAccountBalanceData(trades, config?.startingBalance) as any
      case 'dailyDrawdown':
        return this.calculateDailyDrawdownData(trades) as any
      case 'symbolPerformance':
        return this.calculateSymbolPerformanceData(trades) as any
      case 'hourlyPerformance':
        return this.calculateHourlyPerformanceData(trades) as any

      // Activity & Volume
      case 'dailyVolume':
        return this.calculateDailyVolume(trades) as any
      case 'dailyTradeCount':
        return this.calculateDailyTradeCount(trades) as any
      case 'dailyActiveDays':
        return this.calculateDailyActiveDays(trades) as any

      // Win rates
      case 'winRateOverTime':
        return this.calculateWinRateOverTime(trades) as any
      case 'longWinRateOverTime':
        return this.calculateWinRateOverTime(trades, 'LONG') as any
      case 'shortWinRateOverTime':
        return this.calculateWinRateOverTime(trades, 'SHORT') as any

      // PnL stats
      case 'dailyAvgWin':
        return this.calculateDailyAvgWin(trades) as any
      case 'dailyAvgLoss':
        return this.calculateDailyAvgLoss(trades) as any
      case 'dailyAvgWinLoss':
        return this.calculateDailyAvgWinLoss(trades) as any
      case 'dailyAvgNetTradePnl':
        return this.calculateDailyAvgNetTradePnl(trades) as any
      case 'dailyMaxWin':
        return this.calculateDailyMaxWin(trades) as any
      case 'dailyMaxLoss':
        return this.calculateDailyMaxLoss(trades) as any

      // Breakeven
      case 'dailyBreakevenTrades':
      case 'breakevenTradesOverTime':
        return this.calculateDailyBreakevenTrades(trades) as any
      case 'dailyBreakevenDays':
      case 'breakevenDaysOverTime':
        return this.calculateDailyBreakevenDays(trades) as any

      // Side-specific counts
      case 'dailyLongTrades':
        return this.calculateDailySideCounts(trades, 'LONG') as any
      case 'dailyShortTrades':
        return this.calculateDailySideCounts(trades, 'SHORT') as any
      case 'dailyLongWinningTrades':
        return this.calculateDailySideStatusCounts(trades, 'LONG', 'WIN') as any
      case 'dailyShortWinningTrades':
        return this.calculateDailySideStatusCounts(trades, 'SHORT', 'WIN') as any
      case 'dailyLongLosingTrades':
        return this.calculateDailySideStatusCounts(trades, 'LONG', 'LOSS') as any
      case 'dailyShortLosingTrades':
        return this.calculateDailySideStatusCounts(trades, 'SHORT', 'LOSS') as any

      // Durations
      case 'dailyAvgHoldTimeHours':
        return this.calculateDailyAvgHoldTimeHours(trades) as any
      case 'dailyMaxHoldTimeHours':
        return this.calculateDailyMaxHoldTimeHours(trades) as any

      // Risk/return metrics
      case 'profitFactorOverTime':
        return this.calculateProfitFactorOverTime(trades) as any
      case 'expectancyOverTime':
        return this.calculateExpectancyOverTime(trades) as any
      case 'plannedRMultipleOverTime':
        return this.calculatePlannedRMultipleOverTime(trades) as any
      case 'realizedRMultipleOverTime':
        return this.calculateRealizedRMultipleOverTime(trades) as any

      // Streaks & consistency
      case 'maxConsecutiveWinningDaysOverTime':
        return this.calculateMaxConsecutiveWinningDaysOverTime(trades) as any
      case 'maxConsecutiveLosingDaysOverTime':
        return this.calculateMaxConsecutiveLosingDaysOverTime(trades) as any
      case 'maxConsecutiveWinsOverTime':
        return this.calculateMaxConsecutiveWinsOverTime(trades) as any
      case 'maxConsecutiveLossesOverTime':
        return this.calculateMaxConsecutiveLossesOverTime(trades) as any

      default:
        return []
    }
  }

  private calculateDailyAvgWinLoss(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const result: Record<string, number> = {}
    for (const [date, ts] of Object.entries(groups)) {
      const wins = ts.filter(t => t.netPnl > 0)
      const losses = ts.filter(t => t.netPnl < 0)
      const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.netPnl, 0) / wins.length : 0
      const avgLossAbs = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.netPnl, 0)) / losses.length : 0
      result[date] = avgWin - avgLossAbs
    }
    return this.toSeries(result)
  }

  // Streaks over time helpers
  private calculateDailyNetPnLMap(trades: Trade[]): Record<string, number> {
    const daily = this.calculateDailyPnLData(trades)
    const map: Record<string, number> = {}
    for (const d of daily) map[d.date] = d.pnl
    return map
  }

  private calculateMaxConsecutiveWinningDaysOverTime(trades: Trade[]): Array<{ date: string; value: number }> {
    const dailyMap = this.calculateDailyNetPnLMap(trades)
    const dates = Object.keys(dailyMap).sort((a, b) => a.localeCompare(b))
    let current = 0
    let maxSoFar = 0
    const out: Array<{ date: string; value: number }> = []
    for (const date of dates) {
      if (dailyMap[date] > 0) current += 1; else if (dailyMap[date] < 0) current = 0
      // breakeven keeps streak unchanged
      if (current > maxSoFar) maxSoFar = current
      out.push({ date, value: maxSoFar })
    }
    return out
  }

  private calculateMaxConsecutiveLosingDaysOverTime(trades: Trade[]): Array<{ date: string; value: number }> {
    const dailyMap = this.calculateDailyNetPnLMap(trades)
    const dates = Object.keys(dailyMap).sort((a, b) => a.localeCompare(b))
    let current = 0
    let maxSoFar = 0
    const out: Array<{ date: string; value: number }> = []
    for (const date of dates) {
      if (dailyMap[date] < 0) current += 1; else if (dailyMap[date] > 0) current = 0
      if (current > maxSoFar) maxSoFar = current
      out.push({ date, value: maxSoFar })
    }
    return out
  }

  private calculateMaxConsecutiveWinsOverTime(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const dates = Object.keys(groups).sort((a, b) => a.localeCompare(b))
    let current = 0
    let maxSoFar = 0
    const out: Array<{ date: string; value: number }> = []
    for (const date of dates) {
      const ts = groups[date]
      for (const t of ts) {
        if (t.netPnl > 0 || t.status === 'WIN') current += 1; else if (t.netPnl < 0 || t.status === 'LOSS') current = 0
        if (current > maxSoFar) maxSoFar = current
      }
      out.push({ date, value: maxSoFar })
    }
    return out
  }

  private calculateMaxConsecutiveLossesOverTime(trades: Trade[]): Array<{ date: string; value: number }> {
    const groups = this.groupTradesByOpenDate(trades)
    const dates = Object.keys(groups).sort((a, b) => a.localeCompare(b))
    let current = 0
    let maxSoFar = 0
    const out: Array<{ date: string; value: number }> = []
    for (const date of dates) {
      const ts = groups[date]
      for (const t of ts) {
        if (t.netPnl < 0 || t.status === 'LOSS') current += 1; else if (t.netPnl > 0 || t.status === 'WIN') current = 0
        if (current > maxSoFar) maxSoFar = current
      }
      out.push({ date, value: maxSoFar })
    }
    return out
  }

  private calculateDailyPnLData(trades: Trade[]): Array<{ date: string; pnl: number }> {
    const dailyGroups: Record<string, number> = {}
    
    for (const trade of trades) {
      // Prefer closeDate for realized PnL timing; fallback to openDate
      const iso = (trade.closeDate || trade.openDate || '').trim()
      if (!iso) continue
      const date = iso.split('T')[0]
      if (!date) continue
      dailyGroups[date] = (dailyGroups[date] || 0) + trade.netPnl
    }

    return Object.entries(dailyGroups)
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private calculateCumulativePnLData(trades: Trade[]): Array<{ date: string; cumulative: number }> {
    // Accumulate per trade to ensure a point for every trade, avoiding per-day collapsing
    const sorted = [...trades]
      .filter(t => (t.closeDate || t.openDate))
      .sort((a, b) => {
        const aIso = (a.closeDate || a.openDate) as string
        const bIso = (b.closeDate || b.openDate) as string
        return aIso.localeCompare(bIso)
      })

    let cumulative = 0
    const out: Array<{ date: string; cumulative: number }> = []
    for (const t of sorted) {
      cumulative += t.netPnl
      const iso = (t.closeDate || t.openDate) as string
      // Use just date portion if ISO-like, else fallback to full string
      const date = iso.includes('T') ? iso.split('T')[0] : iso
      out.push({ date, cumulative })
    }
    return out
  }

  // Equity curve as cumulative P&L over time (alias with clearer key)
  private calculateEquityCurveData(trades: Trade[]): Array<{ date: string; equity: number }> {
    const cumulative = this.calculateCumulativePnLData(trades)
    return cumulative.map(d => ({ date: d.date, equity: d.cumulative }))
  }

  // Net account balance over time (starting balance + cumulative P&L)
  private calculateNetAccountBalanceData(trades: Trade[], startingBalance: number = 10000): Array<{ date: string; value: number }> {
    const cumulative = this.calculateCumulativePnLData(trades)
    return cumulative.map(d => ({ date: d.date, value: startingBalance + d.cumulative }))
  }

  // Daily drawdown computed from equity vs running peak
  private calculateDailyDrawdownData(trades: Trade[]): Array<{ date: string; drawdown: number }> {
    const equityCurve = this.calculateEquityCurveData(trades)
    let peak = 0
    return equityCurve.map(point => {
      peak = Math.max(peak, point.equity)
      const drawdown = point.equity - peak // zero or negative
      return { date: point.date, drawdown }
    })
  }

  private calculateSymbolPerformanceData(trades: Trade[]): Array<{ symbol: string; pnl: number; trades: number }> {
    const symbolGroups: Record<string, Trade[]> = {}
    
    for (const trade of trades) {
      if (!symbolGroups[trade.symbol]) symbolGroups[trade.symbol] = []
      symbolGroups[trade.symbol].push(trade)
    }

    return Object.entries(symbolGroups).map(([symbol, symbolTrades]) => ({
      symbol,
      pnl: symbolTrades.reduce((sum, trade) => sum + trade.netPnl, 0),
      trades: symbolTrades.length
    }))
  }

  private calculateHourlyPerformanceData(trades: Trade[]): Array<{ hour: number; pnl: number; trades: number }> {
    const hourlyGroups: Record<number, Trade[]> = {}
    
    for (const trade of trades) {
      if (trade.entryTime) {
        const hour = parseInt(trade.entryTime.split(':')[0])
        if (!hourlyGroups[hour]) hourlyGroups[hour] = []
        hourlyGroups[hour].push(trade)
      }
    }

    return Object.entries(hourlyGroups).map(([hour, hourTrades]) => ({
      hour: parseInt(hour),
      pnl: hourTrades.reduce((sum, trade) => sum + trade.netPnl, 0),
      trades: hourTrades.length
    }))
  }


  private emitEvent(event: AnalyticsEvent): void {
    this.eventHistory.push(event)
    
    // Keep only last 100 events
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-100)
    }
  }

  private handleError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    this.setState({
      ...this.state,
      error: errorMessage,
      loading: false
    })

    this.emitEvent({
      type: 'ERROR',
      timestamp: Date.now(),
      payload: { error: errorMessage }
    })
  }
}