import { logger } from '@/lib/logger'

/**
 * Trade Summary Service for generating AI-powered daily trading reports
 */

import { Trade } from './trade-data.service'

export interface TradeSummaryOptions {
  date: string // YYYY-MM-DD format
  trades: Trade[]
  accountBalance?: number
  notes?: string
}

export interface TradeSummaryResult {
  summary: string
  analysis: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    totalPnL: number
    netPnL: number
    totalCommissions: number
    avgWin: number
    avgLoss: number
    profitFactor: number
    avgRMultiple: number
    largestWin: number
    largestLoss: number
    symbolStats: Record<string, { trades: number; pnl: number; wins: number }>
    modelStats: Record<string, { trades: number; pnl: number; wins: number }>
    timeStats: Record<string, { trades: number; pnl: number }>
    accountBalance?: number
  }
  tradesAnalyzed: number
  date: string
}

class TradeSummaryService {
  /**
   * Generate comprehensive daily trade summary using AI
   */
  async generateDailySummary(options: TradeSummaryOptions): Promise<TradeSummaryResult> {
    if (!options.trades || options.trades.length === 0) {
      throw new Error('No trades provided for analysis')
    }

    try {
      const response = await fetch('/api/ai-trade-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trades: options.trades.map(trade => ({
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side || 'LONG',
            status: trade.status,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            netPnl: trade.netPnl,
            netRoi: trade.netRoi,
            openDate: trade.openDate,
            closeDate: trade.closeDate,
            entryTime: trade.entryTime,
            exitTime: trade.exitTime,
            contractsTraded: trade.contractsTraded,
            commissions: trade.commissions,
            duration: trade.duration,
            rMultiple: trade.rMultiple,
            model: trade.model,
            tags: trade.tags,
            stialInsights: trade.stialInsights
          })),
          date: options.date,
          accountBalance: options.accountBalance,
          notes: options.notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate trade summary')
      }

      const result = await response.json()
      return result

    } catch (error) {
      logger.error('Trade Summary error:', error)
      throw error
    }
  }

  /**
   * Get trades for a specific date
   */
  getTradesForDate(allTrades: Trade[], date: string): Trade[] {
    return allTrades.filter(trade => {
      // Check if trade was opened or closed on the specified date
      return trade.openDate === date || trade.closeDate === date
    })
  }

  /**
   * Get date range trades (for weekly/monthly summaries)
   */
  getTradesForDateRange(allTrades: Trade[], startDate: string, endDate: string): Trade[] {
    return allTrades.filter(trade => {
      const tradeDate = trade.closeDate || trade.openDate
      return tradeDate >= startDate && tradeDate <= endDate
    })
  }

  /**
   * Generate quick summary statistics without AI
   */
  generateQuickStats(trades: Trade[]) {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        avgTrade: 0
      }
    }

    const totalTrades = trades.length
    const winningTrades = trades.filter(t => t.status === 'WIN').length
    const totalPnL = trades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const winRate = (winningTrades / totalTrades) * 100
    const avgTrade = totalPnL / totalTrades

    return {
      totalTrades,
      winRate: Math.round(winRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      avgTrade: Math.round(avgTrade * 100) / 100
    }
  }
}

export const tradeSummaryService = new TradeSummaryService()
