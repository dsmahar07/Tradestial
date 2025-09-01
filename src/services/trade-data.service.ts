import { calculateRMultipleMetrics, calculateRMultipleExpectancy } from '@/utils/r-multiple'
import { calculateTradeDuration } from '@/utils/duration'

export interface Trade {
  id: string
  openDate: string // UTC date in YYYY-MM-DD format
  symbol: string
  status: 'WIN' | 'LOSS'
  closeDate: string // UTC date in YYYY-MM-DD format
  entryPrice: number
  exitPrice: number
  netPnl: number
  netRoi: number
  // For options analytics: when present, used to compute Days Till Expiration (DTE)
  expirationDate?: string // UTC date in YYYY-MM-DD format
  entryTime?: string // UTC time in HH:mm:ss format
  exitTime?: string // UTC time in HH:mm:ss format
  contractsTraded?: number
  adjustedCost?: number
  mae?: number // Maximum Adverse Excursion
  mfe?: number // Maximum Favorable Excursion
  stialInsights?: string
  stialScale?: number
  side?: 'LONG' | 'SHORT'
  points?: number
  ticks?: number
  ticksPerContract?: number
  commissions?: number
  grossPnl?: number
  model?: string
  priceMae?: number
  priceMfe?: number
  runningPnl?: RunningPnlPoint[] | null
  tradeRating?: number
  profitTarget?: number
  stopLoss?: number
  averageEntry?: number
  averageExit?: number
  tags?: string[]
  // Additional properties for extended metrics
  volume?: number
  duration?: string
  pips?: number
  rMultiple?: number
  rating?: number
  accountName?: string
  adjustedProceeds?: number
  bestExitPercent?: string
  bestExitPnl?: number
  bestExitPrice?: number
  bestExitTime?: string
  closeTime?: string
  customTags?: string[]
  executions?: string
  initialRisk?: number
  initialTarget?: number
  instrument?: string
  instrumentType?: string
  mistakes?: string[]
  notes?: string
  openTime?: string
  plannedRMultiple?: string
  positionMAE?: string
  positionMFE?: string
  priceMAE?: number
  priceMFE?: number
  returnPerPip?: string
  totalFees?: number
  totalSwap?: number
  // Hypothetical exit enrichments (computed post-import)
  hypotheticalExit1hPrice?: number
  hypotheticalExit1hPnl?: number
  hypotheticalExit1hPercent?: string
  hypotheticalExit1hTime?: string
  hypotheticalExit2hPrice?: number
  hypotheticalExit2hPnl?: number
  hypotheticalExit2hPercent?: string
  hypotheticalExit2hTime?: string
}

export interface TradeMetrics {
  totalTrades: number
  netCumulativePnl: number
  winningTrades: number
  losingTrades: number
  winRate: number
  avgWinAmount: number
  avgLossAmount: number
  profitFactor: number
  totalWinAmount: number
  totalLossAmount: number
  grossPnl: number
  totalCommissions: number
  avgRoi: number
  maxWin: number
  maxLoss: number
  consecutiveWins: number
  consecutiveLosses: number
  avgTradeDuration: number
  sharpeRatio: number
  maxDrawdown: number
  profitabilityIndex: number
  riskRewardRatio: number
  expectancy: number
  // R-Multiple metrics
  avgPlannedRMultiple: number
  avgRealizedRMultiple: number
  rMultipleExpectancy: number
  tradesWithValidSLTP: number
}

export interface RunningPnlPoint {
  time: string
  value: number
}

// NO MOCK DATA - All data comes from DataStore

export class TradeDataService {
  // Get all trades from DataStore (single source of truth)
  static async getAllTrades(): Promise<Trade[]> {
    // Import DataStore dynamically to avoid circular dependency
    const { DataStore } = await import('./data-store.service')
    return DataStore.getAllTrades()
  }

  // Get trade by ID
  static async getTradeById(id: string): Promise<Trade | null> {
    const { DataStore } = await import('./data-store.service')
    const allTrades = DataStore.getAllTrades()
    return allTrades.find(trade => trade.id === id) || null
  }

  // Get trades by symbol
  static async getTradesBySymbol(symbol: string): Promise<Trade[]> {
    const { DataStore } = await import('./data-store.service')
    return DataStore.getTradesBySymbol(symbol)
  }

  // Get running P&L data for a trade
  static async getRunningPnlData(): Promise<RunningPnlPoint[]> {
    // Return empty array - this would come from real trade data in the future
    return []
  }

  // Process running P&L data (add zero crossing points)
  static processRunningPnlData(data: RunningPnlPoint[]): RunningPnlPoint[] {
    const processed: RunningPnlPoint[] = []
    
    for (let i = 0; i < data.length; i++) {
      const current = data[i]
      const next = data[i + 1]
      
      processed.push(current)
      
      if (next) {
        const currentValue = current.value || 0
        const nextValue = next.value || 0
        
        // Check for zero crossing (positive to negative or vice versa)
        const crossesZero = (currentValue > 0 && nextValue < 0) || (currentValue < 0 && nextValue > 0)
        const involvesZero = currentValue === 0 || nextValue === 0
        
        if (crossesZero && !involvesZero) {
          // Add interpolated zero point
          processed.push({ time: current.time + '+', value: 0 })
        }
      }
    }
    
    return processed
  }

  // Calculate trade metrics
  static calculateMetrics(trades: Trade[], getTradeMetadata?: (tradeId: string) => { profitTarget?: string; stopLoss?: string } | null): TradeMetrics {
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

    // Ensure chronological order for order-dependent metrics (streaks, drawdown)
    const sortedTrades = [...trades].sort((a, b) => {
      const aTime = new Date(`${a.openDate} ${a.entryTime || '00:00:00'}`).getTime()
      const bTime = new Date(`${b.openDate} ${b.entryTime || '00:00:00'}`).getTime()
      return aTime - bTime
    })

    const totalTrades = sortedTrades.length
    const netCumulativePnl = sortedTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const winningTrades = sortedTrades.filter(trade => trade.status === 'WIN').length
    const losingTrades = sortedTrades.filter(trade => trade.status === 'LOSS').length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    
    // Calculate average win and loss amounts
    const winTrades = sortedTrades.filter(trade => trade.status === 'WIN')
    const lossTrades = sortedTrades.filter(trade => trade.status === 'LOSS')
    
    const totalWinAmount = winTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const totalLossAmount = Math.abs(lossTrades.reduce((sum, trade) => sum + trade.netPnl, 0))
    
    const avgWinAmount = winningTrades > 0 ? totalWinAmount / winningTrades : 0
    const avgLossAmount = losingTrades > 0 ? totalLossAmount / losingTrades : 0
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0

    // Calculate additional metrics
    const grossPnl = sortedTrades.reduce((sum, trade) => sum + (trade.grossPnl || trade.netPnl), 0)
    const totalCommissions = sortedTrades.reduce((sum, trade) => sum + (trade.commissions || 0), 0)
    const avgRoi = sortedTrades.reduce((sum, trade) => sum + trade.netRoi, 0) / totalTrades
    
    const maxWin = winTrades.length > 0 ? Math.max(...winTrades.map(t => t.netPnl)) : 0
    const maxLoss = lossTrades.length > 0 ? Math.min(...lossTrades.map(t => t.netPnl)) : 0

    // Calculate consecutive wins/losses
    let consecutiveWins = 0
    let consecutiveLosses = 0
    let currentWinStreak = 0
    let currentLossStreak = 0
    let maxWinStreak = 0
    let maxLossStreak = 0

    sortedTrades.forEach(trade => {
      if (trade.status === 'WIN') {
        currentWinStreak++
        currentLossStreak = 0
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
      } else {
        currentLossStreak++
        currentWinStreak = 0
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
      }
    })

    consecutiveWins = maxWinStreak
    consecutiveLosses = maxLossStreak

    // Calculate drawdown
    let runningPnl = 0
    let peak = 0
    let maxDrawdown = 0

    sortedTrades.forEach(trade => {
      runningPnl += trade.netPnl
      peak = Math.max(peak, runningPnl)
      const drawdown = peak - runningPnl
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    })

    // Simple calculations for remaining metrics
    // Average trade duration in MINUTES, computed per trade using entry/exit times and dates
    const durationMinutes: number[] = sortedTrades
      .map(t => {
        const d = calculateTradeDuration(t.entryTime, t.exitTime, t.openDate, t.closeDate)
        return d ? d.totalMinutes : null
      })
      .filter((v): v is number => typeof v === 'number' && isFinite(v) && v >= 0)
    const avgTradeDuration = durationMinutes.length > 0
      ? durationMinutes.reduce((s, v) => s + v, 0) / durationMinutes.length
      : 0
    const sharpeRatio = 0 // Would need daily returns and risk-free rate
    const profitabilityIndex = winRate / 100
    const riskRewardRatio = avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0
    const expectancy = (winRate / 100) * avgWinAmount - ((100 - winRate) / 100) * avgLossAmount

    // Calculate R-Multiple metrics
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

  // Filter trades by date range
  static filterTradesByDateRange(trades: Trade[], startDate: Date, endDate: Date): Trade[] {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.openDate)
      return tradeDate >= startDate && tradeDate <= endDate
    })
  }

  // Sort trades
  static sortTrades(trades: Trade[], sortBy: 'date' | 'pnl' | 'symbol' | 'rating', order: 'asc' | 'desc' = 'desc'): Trade[] {
    return [...trades].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.openDate).getTime() - new Date(b.openDate).getTime()
          break
        case 'pnl':
          comparison = a.netPnl - b.netPnl
          break
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol)
          break
        case 'rating':
          comparison = (a.tradeRating || 0) - (b.tradeRating || 0)
          break
      }
      
      return order === 'asc' ? comparison : -comparison
    })
  }
}