import { Trade, TradeMetrics, TradeDataService } from './trade-data.service'
import TradeMetadataService from './trade-metadata.service'
import { RuleTrackingService } from './rule-tracking.service'

/**
 * Centralized data store for managing imported trade data
 * In production, this would be backed by a database
 */
export class DataStore {
  private static trades: Trade[] = []
  private static listeners: Array<() => void> = []
  private static startingBalance: number = 10000 // Default starting balance
  private static isInitialized: boolean = false

  // Memory safety limits
  private static readonly MAX_TRADES = 50000 // cap total in-memory trades to prevent OOM
  private static readonly MAX_LISTENERS = 100 // avoid runaway subscriptions
  
  // Storage key for persisting trades
  private static readonly TRADES_STORAGE_KEY = 'tradestial:trades-data'
  private static readonly STARTING_BALANCE_KEY = 'tradestial:starting-balance'

  // Initialize DataStore - load persisted trades from localStorage
  private static initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.TRADES_STORAGE_KEY)
      const storedStarting = localStorage.getItem(this.STARTING_BALANCE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          this.trades = parsed.slice(-this.MAX_TRADES) // Respect limits
          console.log(`DataStore: Loaded ${this.trades.length} trades from localStorage`)
        }
      }
      if (storedStarting !== null) {
        const n = parseFloat(storedStarting)
        if (!isNaN(n)) {
          this.startingBalance = n
        }
      }
    } catch (error) {
      console.warn('DataStore: Failed to load trades from localStorage:', error)
      this.trades = []
    }
    
    this.isInitialized = true
  }

  // Persist trades to localStorage
  private static persistTrades(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.TRADES_STORAGE_KEY, JSON.stringify(this.trades))
      console.log(`DataStore: Persisted ${this.trades.length} trades to localStorage`)
    } catch (error) {
      console.warn('DataStore: Failed to persist trades to localStorage:', error)
    }
  }

  // Format a Date to YYYY-MM-DD using local timezone
  private static formatLocalYMD(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Add trades from CSV import
  static async addTrades(newTrades: Partial<Trade>[], clearExisting: boolean = false): Promise<void> {
    this.initialize()
    
    const validTrades = newTrades
      .filter(trade => this.validateTrade(trade))
      .map(trade => this.normalizeTradeData(trade as Trade))

    if (clearExisting) {
      // Replace all trades with new ones (for fresh imports)
      this.trades = validTrades.slice(-this.MAX_TRADES)
    } else {
      // Add to existing trades
      this.trades = [...this.trades, ...validTrades]
      // Evict oldest trades if exceeding limit
      if (this.trades.length > this.MAX_TRADES) {
        const excess = this.trades.length - this.MAX_TRADES
        this.trades.splice(0, excess)
      }
    }

    this.persistTrades()
    this.notifyListeners()
    
    // Trigger rule tracking checks for affected dates
    this.triggerRuleChecks(validTrades)
  }

  // Get all trades
  static getAllTrades(): Trade[] {
    this.initialize()
    return [...this.trades]
  }

  // Replace all trades (used for fresh imports)
  static async replaceTrades(newTrades: Partial<Trade>[]): Promise<void> {
    await this.addTrades(newTrades, true)
  }

  // Upsert updates for existing trades by id (used by enrichment pipeline)
  static async upsertTrades(partials: Partial<Trade>[]): Promise<void> {
    this.initialize()
    
    if (!partials || partials.length === 0) return
    const byId = new Map(partials.filter(p => p.id).map(p => [p.id as string, p]))
    const updatedTrades: Trade[] = []
    
    this.trades = this.trades.map(t => {
      const patch = byId.get(t.id)
      if (patch) {
        const updatedTrade = { ...t, ...patch }
        updatedTrades.push(updatedTrade)
        return updatedTrade
      }
      return t
    })
    
    this.persistTrades()
    this.notifyListeners()
    
    // Trigger rule tracking checks for affected dates
    this.triggerRuleChecks(updatedTrades)
  }

  // Get trades by date range
  static getTradesByDateRange(startDate: Date, endDate: Date): Trade[] {
    this.initialize()
    const startYMD = this.formatLocalYMD(startDate)
    const endYMD = this.formatLocalYMD(endDate)
    return this.trades.filter(trade => {
      const ymd = (trade.openDate || '').split('T')[0]
      return ymd >= startYMD && ymd <= endYMD
    })
  }

  // Get trades by symbol
  static getTradesBySymbol(symbol: string): Trade[] {
    this.initialize()
    return this.trades.filter(trade =>
      trade.symbol.toLowerCase() === symbol.toLowerCase()
    )
  }

  // Calculate comprehensive metrics
  static calculateMetrics(trades?: Trade[]): TradeMetrics {
    this.initialize()
    const tradesToAnalyze = trades || this.trades
    
    // Get metadata function from TradeMetadataService
    const getTradeMetadata = (tradeId: string) => {
      const metadata = TradeMetadataService.getTradeMetadata(tradeId)
      return metadata ? {
        profitTarget: metadata.profitTarget,
        stopLoss: metadata.stopLoss
      } : null
    }
    
    return TradeDataService.calculateMetrics(tradesToAnalyze, getTradeMetadata)
  }
  
  // Legacy method for backwards compatibility
  private static calculateMetricsLegacy(trades?: Trade[]): TradeMetrics {
    const tradesToAnalyze = trades || this.trades
    
    if (tradesToAnalyze.length === 0) {
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
        // Added fields to satisfy TradeMetrics interface
        avgPlannedRMultiple: 0,
        avgRealizedRMultiple: 0,
        rMultipleExpectancy: 0,
        tradesWithValidSLTP: 0
      }
    }
    
    const totalTrades = tradesToAnalyze.length
    const netCumulativePnl = tradesToAnalyze.reduce((sum, trade) => sum + trade.netPnl, 0)
    const winningTrades = tradesToAnalyze.filter(trade => trade.netPnl > 0).length
    const losingTrades = tradesToAnalyze.filter(trade => trade.netPnl < 0).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    
    const totalWinAmount = tradesToAnalyze
      .filter(trade => trade.netPnl > 0)
      .reduce((sum, trade) => sum + trade.netPnl, 0)
    const totalLossAmount = Math.abs(tradesToAnalyze
      .filter(trade => trade.netPnl < 0)
      .reduce((sum, trade) => sum + trade.netPnl, 0))
    
    const avgWinAmount = winningTrades > 0 ? totalWinAmount / winningTrades : 0
    const avgLossAmount = losingTrades > 0 ? totalLossAmount / losingTrades : 0
    const profitFactor = avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0

    // Additional metrics to satisfy TradeMetrics
    const grossPnl = tradesToAnalyze.reduce((sum, trade) => sum + (trade.grossPnl || trade.netPnl), 0)
    const totalCommissions = tradesToAnalyze.reduce((sum, trade) => sum + (trade.commissions || 0), 0)
    const avgRoi = tradesToAnalyze.reduce((sum, trade) => sum + (trade.netRoi || 0), 0) / Math.max(totalTrades, 1)
    const maxWin = winningTrades > 0 ? Math.max(...tradesToAnalyze.filter(t => t.netPnl > 0).map(t => t.netPnl)) : 0
    const maxLoss = losingTrades > 0 ? Math.min(...tradesToAnalyze.filter(t => t.netPnl < 0).map(t => t.netPnl)) : 0

    // Streaks
    let currentWin = 0, currentLoss = 0, maxWinStreak = 0, maxLossStreak = 0
    tradesToAnalyze.forEach(t => {
      if (t.netPnl >= 0) {
        currentWin++; currentLoss = 0; maxWinStreak = Math.max(maxWinStreak, currentWin)
      } else {
        currentLoss++; currentWin = 0; maxLossStreak = Math.max(maxLossStreak, currentLoss)
      }
    })

    // Drawdown
    let running = 0, peak = 0, maxDrawdown = 0
    tradesToAnalyze.forEach(t => {
      running += t.netPnl
      peak = Math.max(peak, running)
      maxDrawdown = Math.max(maxDrawdown, peak - running)
    })

    const avgTradeDuration = 0 // not available without per-trade durations in minutes
    const sharpeRatio = 0 // placeholder until daily returns available
    const profitabilityIndex = winRate / 100
    const riskRewardRatio = avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0
    const expectancy = (winRate / 100) * avgWinAmount - ((100 - winRate) / 100) * avgLossAmount

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
      consecutiveWins: maxWinStreak,
      consecutiveLosses: maxLossStreak,
      avgTradeDuration,
      sharpeRatio,
      maxDrawdown,
      profitabilityIndex,
      riskRewardRatio,
      expectancy,
      // Added fields to satisfy TradeMetrics interface
      avgPlannedRMultiple: 0,
      avgRealizedRMultiple: 0,
      rMultipleExpectancy: 0,
      tradesWithValidSLTP: 0
    }
  }

  // Calculate dashboard KPIs
  static calculateDashboardKPIs() {
    const metrics = this.calculateMetrics()
    const trades = this.getAllTrades()
    const currentBalance = this.getCurrentAccountBalance()
    
    return {
      netPnl: {
        value: metrics.netCumulativePnl,
        formatted: this.formatCurrency(metrics.netCumulativePnl),
        isPositive: metrics.netCumulativePnl >= 0
      },
      netAccountBalance: {
        value: currentBalance,
        formatted: this.formatCurrency(currentBalance),
        isPositive: currentBalance >= this.startingBalance
      },
      winRate: {
        value: metrics.winRate,
        formatted: `${Math.round(metrics.winRate)}%`,
        isPositive: metrics.winRate > 50
      },
      profitFactor: {
        value: metrics.profitFactor,
        formatted: `${metrics.profitFactor.toFixed(2)}`,
        isPositive: metrics.profitFactor > 1
      },
      avgWinLoss: {
        value: metrics.avgWinAmount / Math.max(metrics.avgLossAmount, 1),
        formatted: `${(metrics.avgWinAmount / Math.max(metrics.avgLossAmount, 1)).toFixed(2)}`,
        isPositive: metrics.avgWinAmount > metrics.avgLossAmount
      },
      currentStreak: this.calculateCurrentStreak(trades),
      tradeExpectancy: {
        value: (metrics.winRate / 100) * metrics.avgWinAmount - ((100 - metrics.winRate) / 100) * metrics.avgLossAmount,
        formatted: this.formatCurrency((metrics.winRate / 100) * metrics.avgWinAmount - ((100 - metrics.winRate) / 100) * metrics.avgLossAmount)
      },
      avgPlannedRMultiple: {
        value: metrics.avgPlannedRMultiple || 0,
        formatted: `${(metrics.avgPlannedRMultiple || 0).toFixed(2)}R`
      },
      avgRealizedRMultiple: {
        value: metrics.avgRealizedRMultiple || 0,
        formatted: `${(metrics.avgRealizedRMultiple || 0).toFixed(2)}R`
      }
    }
  }

  // Calculate performance metrics for analytics page
  static calculatePerformanceMetrics() {
    const trades = this.getAllTrades()
    const metrics = this.calculateMetrics()

    if (trades.length === 0) {
      return this.getEmptyPerformanceMetrics()
    }

    // Group trades by day for daily metrics
    const dailyGroups = this.groupTradesByDay(trades)
    const dailyMetrics = Object.values(dailyGroups).map(dayTrades =>
      this.calculateMetrics(dayTrades)
    )

    return {
      // Summary metrics
      netPnL: { value: metrics.netCumulativePnl, formatted: this.formatCurrency(metrics.netCumulativePnl) },
      winRate: { value: metrics.winRate, formatted: `${Math.round(metrics.winRate)}%` },
      profitFactor: { value: metrics.profitFactor, formatted: metrics.profitFactor.toFixed(2) },
      tradeExpectancy: { value: (metrics.winRate / 100) * metrics.avgWinAmount - ((100 - metrics.winRate) / 100) * metrics.avgLossAmount },
      avgNetTradePnL: { value: metrics.netCumulativePnl / trades.length },
      avgDailyVolume: { value: this.calculateAvgDailyVolume(trades) },
      loggedDays: { value: Object.keys(dailyGroups).length },

      // Daily metrics
      avgDailyWinRate: { value: dailyMetrics.reduce((sum, m) => sum + m.winRate, 0) / dailyMetrics.length },
      avgDailyNetPnL: { value: dailyMetrics.reduce((sum, m) => sum + m.netCumulativePnl, 0) / dailyMetrics.length },
      maxDailyNetDrawdown: { value: Math.min(...dailyMetrics.map(m => m.netCumulativePnl)) },
      largestProfitableDay: { value: Math.max(...dailyMetrics.map(m => m.netCumulativePnl)) },
      largestLosingDay: { value: Math.min(...dailyMetrics.map(m => m.netCumulativePnl)) },

      // Trade-specific metrics
      avgTradeWinLoss: { value: metrics.avgWinAmount / Math.max(metrics.avgLossAmount, 1) },
      avgHoldTime: { value: this.calculateAvgHoldTime(trades), formatted: this.formatDuration(this.calculateAvgHoldTime(trades)) },
      largestProfitableTrade: { value: Math.max(...trades.map(t => t.netPnl)) },
      largestLosingTrade: { value: Math.min(...trades.map(t => t.netPnl)) },
      longsWinRate: { value: this.calculateSideWinRate(trades, 'LONG') },
      shortsWinRate: { value: this.calculateSideWinRate(trades, 'SHORT') },

      // Additional metrics
      avgDailyWinLoss: { value: this.calculateAvgDailyWinLoss(dailyMetrics) },
      avgNetDrawdown: { value: this.calculateAvgDrawdown(trades) },
      avgTradingDaysDuration: { value: this.calculateAvgTradingDayDuration(dailyGroups) },
      longestTradeDuration: { value: this.calculateLongestTradeDuration(trades) },
      avgPlannedRMultiple: { value: metrics.avgPlannedRMultiple, formatted: `${metrics.avgPlannedRMultiple.toFixed(2)}R` },
      avgRealizedRMultiple: { value: metrics.avgRealizedRMultiple, formatted: `${metrics.avgRealizedRMultiple.toFixed(2)}R` },
      zellaScale: { current: 7.5, max: 10, color: 'green' as const } // Placeholder
    }
  }

  // Get chart data for various visualizations
  static getChartData() {
    const trades = this.getAllTrades()

    return {
      dailyPnL: this.getDailyPnLData(trades),
      cumulativePnL: this.getCumulativePnLData(trades),
      symbolPerformance: this.getSymbolPerformanceData(trades),
      timePerformance: this.getTimePerformanceData(trades),
      monthlyData: this.getMonthlyData(trades),
      drawdownData: this.getDrawdownData(trades)
    }
  }

  // Subscribe to data changes
  static subscribe(callback: () => void): () => void {
    if (this.listeners.length >= this.MAX_LISTENERS) {
      // Evict the oldest listener to prevent leaks
      this.listeners.shift()
    }
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  // Set starting balance
  static async setStartingBalance(balance: number): Promise<void> {
    this.startingBalance = balance
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STARTING_BALANCE_KEY, String(balance))
      } catch (err) {
        console.warn('DataStore: Failed to persist starting balance:', err)
      }
    }
    this.notifyListeners()
  }

  // Get starting balance
  static getStartingBalance(): number {
    this.initialize()
    return this.startingBalance
  }

  // Get current account balance (starting balance + cumulative P&L)
  static getCurrentAccountBalance(): number {
    this.initialize()
    const cumulativePnL = this.trades.reduce((sum, trade) => sum + trade.netPnl, 0)
    return this.startingBalance + cumulativePnL
  }

  // Clear all data (for testing)
  static clearData(): void {
    this.trades = []
    this.startingBalance = 10000
    // Remove persisted trades so data doesn't reappear after reload
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.TRADES_STORAGE_KEY)
        localStorage.removeItem(this.STARTING_BALANCE_KEY)
      } catch (error) {
        console.warn('DataStore: Failed to clear persisted trades:', error)
      }
    }
    this.notifyListeners()
  }

  // Get data source information for debugging
  static getDataInfo(): { 
    count: number
    lastUpdated: number
    sampleTradeId?: string 
  } {
    return {
      count: this.trades.length,
      lastUpdated: Date.now(),
      sampleTradeId: this.trades[0]?.id
    }
  }

  // Private helper methods
  private static validateTrade(trade: Partial<Trade>): boolean {
    return !!(
      trade.symbol && 
      trade.openDate && 
      typeof trade.netPnl === 'number' &&
      typeof trade.contractsTraded === 'number'
    )
  }

  private static normalizeTradeData(trade: Trade): Trade {
    // Normalize dates to YYYY-MM-DD (local), avoid UTC shifts
    const normalizeYMD = (value?: string): string | undefined => {
      if (!value) return undefined
      // If includes 'T', take date part
      if (value.includes('T')) return value.split('T')[0]
      // If MM/DD/YYYY, convert
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [mm, dd, yyyy] = value.split('/')
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
      }
      // If YYYY-MM-DD, keep
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
      // Fallback: parse with Date and format locally
      const d = new Date(value)
      return isNaN(d.getTime()) ? value : DataStore.formatLocalYMD(d)
    }

    const openYMD = normalizeYMD(trade.openDate) || DataStore.formatLocalYMD(new Date())
    const closeYMD = normalizeYMD(trade.closeDate) || openYMD

    // Derive sensible defaults for Best Exit fields if missing.
    // Without intra-trade MFE path, we use realized exit metrics as a proxy so the UI can display values.
    // Compute normalized ROI percent
    const parseProvidedRoiToPercent = (roi: any): number | undefined => {
      if (roi === undefined || roi === null || roi === '') return undefined
      if (typeof roi === 'string') {
        const cleaned = roi.replace('%', '').trim()
        const n = parseFloat(cleaned)
        return isNaN(n) ? undefined : n
      }
      if (typeof roi === 'number') {
        // If value looks like a ratio (<= 1), convert to percent
        return roi <= 1 ? roi * 100 : roi
      }
      return undefined
    }

    const costBasis = (() => {
      const adjusted = trade.adjustedCost
      if (typeof adjusted === 'number' && adjusted > 0) return adjusted
      const qty = typeof trade.contractsTraded === 'number' && trade.contractsTraded > 0 ? trade.contractsTraded : 1
      const entry = typeof trade.entryPrice === 'number' ? Math.abs(trade.entryPrice) : 0
      const basis = entry * qty
      return basis > 0 ? basis : 0
    })()

    const computedRoiPct = (() => {
      const provided = parseProvidedRoiToPercent(trade.netRoi)
      if (provided !== undefined) return provided
      if (typeof trade.netPnl === 'number' && costBasis > 0) return (trade.netPnl / costBasis) * 100
      return 0
    })()

    const realizedBestExitPnl = typeof trade.bestExitPnl === 'number' ? trade.bestExitPnl : trade.netPnl
    const realizedBestExitPercent = typeof trade.bestExitPercent === 'string'
      ? trade.bestExitPercent
      : `${computedRoiPct.toFixed(2)}%`
    const realizedBestExitPrice = typeof trade.bestExitPrice === 'number' ? trade.bestExitPrice : trade.exitPrice
    const realizedBestExitTime = typeof trade.bestExitTime === 'string' && trade.bestExitTime.length > 0
      ? trade.bestExitTime
      : (trade.exitTime || trade.closeTime)

    return {
      ...trade,
      id: trade.id || `trade_${Date.now()}_${Math.random()}`,
      openDate: openYMD,
      closeDate: closeYMD,
      status: trade.netPnl >= 0 ? 'WIN' : 'LOSS',
      // netRoi is stored as a percentage number (e.g., 12.5 means 12.5%)
      netRoi: computedRoiPct,
      commissions: trade.commissions || 0,
      grossPnl: trade.grossPnl || trade.netPnl,
      side: trade.side || 'LONG',
      // Best exit fallbacks
      bestExitPnl: realizedBestExitPnl,
      bestExitPercent: realizedBestExitPercent,
      bestExitPrice: realizedBestExitPrice,
      bestExitTime: realizedBestExitTime
    }
  }

  private static calculateCurrentStreak(trades: Trade[]): { value: number; type: 'win' | 'loss' } {
    if (trades.length === 0) return { value: 0, type: 'win' }
    // Sort by YYYY-MM-DD strings to avoid UTC parsing issues
    const sortedTrades = [...trades].sort((a, b) => b.openDate.localeCompare(a.openDate))

    let streak = 1
    const latestTrade = sortedTrades[0]
    const streakType = latestTrade.netPnl >= 0 ? 'win' : 'loss'

    for (let i = 1; i < sortedTrades.length; i++) {
      const currentType = sortedTrades[i].netPnl >= 0 ? 'win' : 'loss'
      if (currentType === streakType) {
        streak++
      } else {
        break
      }
    }
    
    return { value: streak, type: streakType }
  }
  
  private static groupTradesByDay(trades: Trade[]): Record<string, Trade[]> {
    return trades.reduce((groups, trade) => {
      const day = trade.openDate.split('T')[0] // Get YYYY-MM-DD part
      if (!groups[day]) groups[day] = []
      groups[day].push(trade)
      return groups
    }, {} as Record<string, Trade[]>)
  }
  
  private static calculateAvgDailyVolume(trades: Trade[]): number {
    const dailyGroups = this.groupTradesByDay(trades)
    const dailyVolumes = Object.values(dailyGroups).map(dayTrades =>
      dayTrades.reduce((sum, trade) => sum + (trade.contractsTraded || 0), 0)
    )
    return dailyVolumes.reduce((sum, vol) => sum + vol, 0) / dailyVolumes.length
  }
  
  private static calculateAvgHoldTime(trades: Trade[]): number {
    const tradesWithTimes = trades.filter(trade => trade.entryTime && trade.exitTime)
    if (tradesWithTimes.length === 0) return 0
    
    const holdTimes = tradesWithTimes.map(trade => {
      const entry = new Date(`${trade.openDate} ${trade.entryTime}`)
      const exit = new Date(`${trade.closeDate} ${trade.exitTime}`)
      return exit.getTime() - entry.getTime()
    })
    
    return holdTimes.reduce((sum, time) => sum + time, 0) / holdTimes.length / (1000 * 60) // Convert to minutes
  }
  
  private static calculateSideWinRate(trades: Trade[], side: 'LONG' | 'SHORT'): number {
    const sideTrades = trades.filter(trade => trade.side === side)
    if (sideTrades.length === 0) return 0
    
    const wins = sideTrades.filter(trade => trade.netPnl > 0).length
    return (wins / sideTrades.length) * 100
  }
  
  private static getDailyPnLData(trades: Trade[]): Array<{ date: string; pnl: number }> {
    const dailyGroups = this.groupTradesByDay(trades)
    
    return Object.entries(dailyGroups)
      .map(([date, dayTrades]) => ({
        date,
        pnl: dayTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
  
  private static getCumulativePnLData(trades: Trade[]): Array<{ date: string; cumulative: number }> {
    const dailyPnL = this.getDailyPnLData(trades)
    let cumulative = 0
    
    return dailyPnL.map(day => {
      cumulative += day.pnl
      return { date: day.date, cumulative }
    })
  }
  
  private static getSymbolPerformanceData(trades: Trade[]): Array<{ symbol: string; pnl: number; trades: number; winRate: number }> {
    const symbolGroups = trades.reduce((groups, trade) => {
      if (!groups[trade.symbol]) groups[trade.symbol] = []
      groups[trade.symbol].push(trade)
      return groups
    }, {} as Record<string, Trade[]>)
    
    return Object.entries(symbolGroups).map(([symbol, symbolTrades]) => ({
      symbol,
      pnl: symbolTrades.reduce((sum, trade) => sum + trade.netPnl, 0),
      trades: symbolTrades.length,
      winRate: (symbolTrades.filter(t => t.netPnl > 0).length / symbolTrades.length) * 100
    }))
  }
  
  private static getTimePerformanceData(trades: Trade[]): Array<{ hour: number; pnl: number; trades: number }> {
    const hourlyGroups: Record<number, Trade[]> = {}
    
    trades.forEach(trade => {
      if (trade.entryTime) {
        const hour = parseInt(trade.entryTime.split(':')[0])
        if (!hourlyGroups[hour]) hourlyGroups[hour] = []
        hourlyGroups[hour].push(trade)
      }
    })
    
    return Object.entries(hourlyGroups).map(([hour, hourTrades]) => ({
      hour: parseInt(hour),
      pnl: hourTrades.reduce((sum, trade) => sum + trade.netPnl, 0),
      trades: hourTrades.length
    }))
  }
  
  private static getMonthlyData(trades: Trade[]): Array<{ month: string; pnl: number; trades: number }> {
    const monthlyGroups: Record<string, Trade[]> = {}
    
    trades.forEach(trade => {
      const month = trade.openDate.substring(0, 7) // YYYY-MM
      if (!monthlyGroups[month]) monthlyGroups[month] = []
      monthlyGroups[month].push(trade)
    })
    
    return Object.entries(monthlyGroups).map(([month, monthTrades]) => ({
      month,
      pnl: monthTrades.reduce((sum, trade) => sum + trade.netPnl, 0),
      trades: monthTrades.length
    }))
  }
  
  private static getDrawdownData(trades: Trade[]): Array<{ date: string; drawdown: number }> {
    const cumulativePnL = this.getCumulativePnLData(trades)
    let peak = 0
    
    return cumulativePnL.map(point => {
      if (point.cumulative > peak) peak = point.cumulative
      const drawdown = peak - point.cumulative
      return { date: point.date, drawdown }
    })
  }
  
  private static calculateAvgDailyWinLoss(dailyMetrics: TradeMetrics[]): number {
    const ratios = dailyMetrics
      .filter(m => m.avgLossAmount > 0)
      .map(m => m.avgWinAmount / m.avgLossAmount)
    
    return ratios.length > 0 ? ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length : 0
  }
  
  private static calculateAvgDrawdown(trades: Trade[]): number {
    const drawdownData = this.getDrawdownData(trades)
    return drawdownData.reduce((sum, point) => sum + point.drawdown, 0) / drawdownData.length
  }
  
  private static calculateAvgTradingDayDuration(dailyGroups: Record<string, Trade[]>): number {
    const durations = Object.values(dailyGroups).map(dayTrades => {
      const times = dayTrades
        .filter(t => t.entryTime && t.exitTime)
        .map(t => ({ entry: t.entryTime!, exit: t.exitTime! }))
      
      if (times.length === 0) return 0
      
      const earliest = Math.min(...times.map(t => this.timeToMinutes(t.entry)))
      const latest = Math.max(...times.map(t => this.timeToMinutes(t.exit)))
      
      return latest - earliest
    }).filter(d => d > 0)
    
    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0
  }
  
  private static calculateLongestTradeDuration(trades: Trade[]): number {
    const durations = trades
      .filter(t => t.entryTime && t.exitTime)
      .map(t => {
        const entry = new Date(`${t.openDate} ${t.entryTime}`)
        const exit = new Date(`${t.closeDate} ${t.exitTime}`)
        return exit.getTime() - entry.getTime()
      })
    
    return durations.length > 0 ? Math.max(...durations) / (1000 * 60) : 0 // Convert to minutes
  }
  
  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  private static formatCurrency(amount: number): string {
    // Format currency with standard 2 decimal places
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  private static formatDuration(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }
  
  private static getEmptyPerformanceMetrics() {
    return {
      netPnL: { value: 0, formatted: '$0.00' },
      winRate: { value: 0, formatted: '0%' },
      profitFactor: { value: 0, formatted: '0.00' },
      tradeExpectancy: { value: 0 },
      avgNetTradePnL: { value: 0 },
      avgDailyVolume: { value: 0 },
      loggedDays: { value: 0 },
      avgDailyWinRate: { value: 0 },
      avgDailyNetPnL: { value: 0 },
      maxDailyNetDrawdown: { value: 0 },
      largestProfitableDay: { value: 0 },
      largestLosingDay: { value: 0 },
      avgTradeWinLoss: { value: 0 },
      avgHoldTime: { value: 0, formatted: '0m' },
      largestProfitableTrade: { value: 0 },
      largestLosingTrade: { value: 0 },
      longsWinRate: { value: 0 },
      shortsWinRate: { value: 0 },
      avgDailyWinLoss: { value: 0 },
      avgNetDrawdown: { value: 0 },
      avgTradingDaysDuration: { value: 0 },
      longestTradeDuration: { value: 0 },
      avgPlannedRMultiple: { value: 0, formatted: '0R' },
      avgRealizedRMultiple: { value: 0, formatted: '0R' },
      zellaScale: { current: 0, max: 10, color: 'red' as const }
    }
  }
  
  private static notifyListeners(): void {
    // Snapshot to prevent mutation during iteration
    const listeners = [...this.listeners]
    for (const listener of listeners) {
      try {
        listener()
      } catch (err) {
        // Swallow listener errors to avoid disrupting state updates
        // eslint-disable-next-line no-console
        console.warn('DataStore listener error:', err)
      }
    }
  }

  // Trigger rule tracking checks for trades from affected dates
  private static triggerRuleChecks(trades: Trade[]): void {
    if (!trades.length) return

    // Get unique dates from trades
    const affectedDates = new Set<string>()
    trades.forEach(trade => {
      const dateStr = trade.openDate.split('T')[0] // Get YYYY-MM-DD part
      affectedDates.add(dateStr)
    })

    // Trigger rule checks for each affected date
    affectedDates.forEach(dateStr => {
      // Link trades to model rule
      RuleTrackingService.trackLinkTradesToModelRule(dateStr)
      
      // Stop loss rule  
      RuleTrackingService.trackStopLossRule(dateStr)
      
      // Note: Max loss rules would need their configured amounts from trading rules
      // These are handled by the progress tracker when it gets the rule configuration
    })
  }
}