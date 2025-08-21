import { Trade, TradeMetrics } from './trade-data.service'

/**
 * Centralized data store for managing imported trade data
 * In production, this would be backed by a database
 */
export class DataStore {
  private static trades: Trade[] = []
  private static listeners: Array<() => void> = []
  
  // Add trades from CSV import
  static async addTrades(newTrades: Partial<Trade>[]): Promise<void> {
    const validTrades = newTrades
      .filter(trade => this.validateTrade(trade))
      .map(trade => this.normalizeTradeData(trade as Trade))
    
    this.trades = [...this.trades, ...validTrades]
    this.notifyListeners()
  }
  
  // Get all trades
  static getAllTrades(): Trade[] {
    return [...this.trades]
  }
  
  // Get trades by date range
  static getTradesByDateRange(startDate: Date, endDate: Date): Trade[] {
    return this.trades.filter(trade => {
      const tradeDate = new Date(trade.openDate)
      return tradeDate >= startDate && tradeDate <= endDate
    })
  }
  
  // Get trades by symbol
  static getTradesBySymbol(symbol: string): Trade[] {
    return this.trades.filter(trade => 
      trade.symbol.toLowerCase() === symbol.toLowerCase()
    )
  }
  
  // Calculate comprehensive metrics
  static calculateMetrics(trades?: Trade[]): TradeMetrics {
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
        totalLossAmount: 0
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
      totalLossAmount
    }
  }
  
  // Calculate dashboard KPIs
  static calculateDashboardKPIs() {
    const metrics = this.calculateMetrics()
    const trades = this.getAllTrades()
    
    return {
      netPnl: {
        value: metrics.netCumulativePnl,
        formatted: this.formatCurrency(metrics.netCumulativePnl),
        isPositive: metrics.netCumulativePnl >= 0
      },
      winRate: {
        value: metrics.winRate,
        formatted: `${Math.round(metrics.winRate)}%`,
        isPositive: metrics.winRate > 50
      },
      profitFactor: {
        value: metrics.profitFactor,
        formatted: `${metrics.profitFactor.toFixed(2)}:1`,
        isPositive: metrics.profitFactor > 1
      },
      avgWinLoss: {
        value: metrics.avgWinAmount / Math.max(metrics.avgLossAmount, 1),
        formatted: `${(metrics.avgWinAmount / Math.max(metrics.avgLossAmount, 1)).toFixed(2)}:1`,
        isPositive: metrics.avgWinAmount > metrics.avgLossAmount
      },
      currentStreak: this.calculateCurrentStreak(trades),
      tradeExpectancy: {
        value: (metrics.winRate / 100) * metrics.avgWinAmount - ((100 - metrics.winRate) / 100) * metrics.avgLossAmount,
        formatted: this.formatCurrency((metrics.winRate / 100) * metrics.avgWinAmount - ((100 - metrics.winRate) / 100) * metrics.avgLossAmount)
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
      avgPlannedRMultiple: { value: 0, formatted: '0R' }, // Placeholder
      avgRealizedRMultiple: { value: 0, formatted: '0R' }, // Placeholder
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
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }
  
  // Clear all data (for testing)
  static clearData(): void {
    this.trades = []
    this.notifyListeners()
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
    return {
      ...trade,
      id: trade.id || `trade_${Date.now()}_${Math.random()}`,
      closeDate: trade.closeDate || trade.openDate,
      status: trade.netPnl >= 0 ? 'WIN' : 'LOSS',
      netRoi: trade.netRoi || (trade.netPnl / Math.max(trade.adjustedCost || 1, 1)),
      commissions: trade.commissions || 0,
      grossPnl: trade.grossPnl || trade.netPnl,
      side: trade.side || 'LONG'
    }
  }
  
  private static calculateCurrentStreak(trades: Trade[]): { value: number; type: 'win' | 'loss' } {
    if (trades.length === 0) return { value: 0, type: 'win' }
    
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(b.openDate).getTime() - new Date(a.openDate).getTime()
    )
    
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
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
    this.listeners.forEach(listener => listener())
  }
}