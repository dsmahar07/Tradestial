'use client'

export interface ModelStats {
  total: number
  wins: number
  losses: number
  winRate: number
  netPnL: number
  avgWinner: number
  avgLoser: number
  profitFactor: number
  expectancy: number
  lastUpdated: number
}

export interface TradeAssignment {
  tradeId: string
  modelId: string
  assignedAt: number
}

const ASSIGNMENTS_KEY = 'tradestial:strategy-assignments'
const STATS_CACHE_KEY = 'tradestial:model-stats-cache'

/**
 * Service to manage model-trade assignments and calculate dynamic stats
 */
export class ModelStatsService {
  private static instance: ModelStatsService
  private assignments: Record<string, string[]> = {}
  private statsCache: Record<string, ModelStats> = {}

  private constructor() {
    this.loadData()
  }

  static getInstance(): ModelStatsService {
    if (!ModelStatsService.instance) {
      ModelStatsService.instance = new ModelStatsService()
    }
    return ModelStatsService.instance
  }

  private loadData() {
    if (typeof window === 'undefined') return

    try {
      // Load assignments - also check if the format is compatible
      const assignmentsRaw = localStorage.getItem(ASSIGNMENTS_KEY)
      if (assignmentsRaw) {
        const parsed = JSON.parse(assignmentsRaw)
        // Validate format - should be object with string keys and string[] values
        if (parsed && typeof parsed === 'object') {
          let isValid = true
          for (const [key, value] of Object.entries(parsed)) {
            if (typeof key !== 'string' || !Array.isArray(value)) {
              isValid = false
              break
            }
          }
          if (isValid) {
            this.assignments = parsed
            console.log('Loaded assignments:', this.assignments)
          } else {
            console.warn('Invalid assignments format, resetting')
            this.assignments = {}
          }
        } else {
          this.assignments = {}
        }
      } else {
        this.assignments = {}
      }

      // Load stats cache
      const cacheRaw = localStorage.getItem(STATS_CACHE_KEY)
      this.statsCache = cacheRaw ? JSON.parse(cacheRaw) : {}
      console.log('Loaded stats cache:', Object.keys(this.statsCache))
    } catch (error) {
      console.warn('Failed to load model stats data:', error)
      this.assignments = {}
      this.statsCache = {}
    }
  }

  private saveData() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(this.assignments))
      localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(this.statsCache))
      
      // Notify other components that stats have changed (use setTimeout to avoid render issues)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tradestial:model-stats-updated'))
      }, 0)
    } catch (error) {
      console.warn('Failed to save model stats data:', error)
    }
  }

  /**
   * Assign a trade to a model
   */
  assignTradeToModel(tradeId: string, modelId: string) {
    console.log(`Assigning trade ${tradeId} to model ${modelId}`)
    
    if (!this.assignments[modelId]) {
      this.assignments[modelId] = []
    }
    
    // Remove trade from other models first
    Object.keys(this.assignments).forEach(mId => {
      if (mId !== modelId) {
        const beforeLength = this.assignments[mId].length
        this.assignments[mId] = this.assignments[mId].filter(tId => tId !== tradeId)
        if (this.assignments[mId].length !== beforeLength) {
          console.log(`Removed trade ${tradeId} from model ${mId}`)
        }
      }
    })

    // Add to new model if not already assigned
    if (!this.assignments[modelId].includes(tradeId)) {
      this.assignments[modelId].push(tradeId)
      console.log(`Added trade ${tradeId} to model ${modelId}. Total assignments for this model: ${this.assignments[modelId].length}`)
    } else {
      console.log(`Trade ${tradeId} already assigned to model ${modelId}`)
    }

    console.log('Current assignments after assignment:', this.assignments)
    this.invalidateStatsCache(modelId)
    this.saveData()
  }

  /**
   * Remove a trade from a model
   */
  removeTradeFromModel(tradeId: string, modelId: string) {
    if (this.assignments[modelId]) {
      this.assignments[modelId] = this.assignments[modelId].filter(tId => tId !== tradeId)
      this.invalidateStatsCache(modelId)
      this.saveData()
    }
  }

  /**
   * Get all trades assigned to a model
   */
  getModelTrades(modelId: string): string[] {
    return this.assignments[modelId] || []
  }

  /**
   * Get the model assigned to a trade
   */
  getTradeModel(tradeId: string): string | null {
    for (const [modelId, tradeIds] of Object.entries(this.assignments)) {
      if (tradeIds.includes(tradeId)) {
        return modelId
      }
    }
    return null
  }

  /**
   * Calculate stats for a model based on assigned trades
   */
  calculateModelStats(modelId: string, tradesData: any[], cacheResults: boolean = false): ModelStats {
    const assignedTradeIds = this.getModelTrades(modelId)
    const assignedTrades = tradesData.filter(trade => 
      assignedTradeIds.includes(trade.id)
    )

    const total = assignedTrades.length
    let wins = 0
    let losses = 0
    let sumWin = 0
    let sumLossAbs = 0
    let netPnL = 0

    for (const trade of assignedTrades) {
      // Use the same P&L extraction logic as the chart
      const pnl = typeof trade.netPnl === 'number' ? trade.netPnl : 
                  typeof trade.pnl === 'number' ? trade.pnl : 
                  this.parsePnL(trade.netPnl || trade.pnl || 0)
      
      netPnL += pnl
      if (pnl > 0) {
        wins += 1
        sumWin += pnl
      } else if (pnl < 0) {
        losses += 1
        sumLossAbs += Math.abs(pnl)
      }
    }

    const winRate = total ? (wins / total) * 100 : 0
    const avgWinner = wins ? sumWin / wins : 0
    const avgLoser = losses ? -(sumLossAbs / losses) : 0
    const profitFactor = sumLossAbs > 0 ? sumWin / sumLossAbs : wins > 0 ? Infinity : 0
    const expectancy = total ? (wins / total) * avgWinner + (losses / total) * avgLoser : 0

    const stats: ModelStats = {
      total,
      wins,
      losses,
      winRate,
      netPnL,
      avgWinner,
      avgLoser,
      profitFactor,
      expectancy,
      lastUpdated: Date.now()
    }

    // Cache the stats only if requested (avoid caching during render cycles)
    if (cacheResults) {
      this.statsCache[modelId] = stats
    }

    return stats
  }

  /**
   * Get cached stats for a model (if fresh) or calculate new ones
   */
  getModelStats(modelId: string, tradesData: any[], maxCacheAgeMs: number = 5 * 60 * 1000): ModelStats {
    const cached = this.statsCache[modelId]
    
    // Use cache if it exists and is fresh
    if (cached && (Date.now() - cached.lastUpdated) < maxCacheAgeMs) {
      return cached
    }

    // Otherwise calculate fresh stats (with caching enabled for explicit calls)
    return this.calculateModelStats(modelId, tradesData, true)
  }

  /**
   * Invalidate stats cache for a specific model
   */
  private invalidateStatsCache(modelId: string) {
    delete this.statsCache[modelId]
  }

  /**
   * Clear all stats cache
   */
  clearStatsCache() {
    this.statsCache = {}
    this.saveData()
  }

  /**
   * Get all model assignments
   */
  getAllAssignments(): Record<string, string[]> {
    return { ...this.assignments }
  }

  /**
   * Helper to parse P&L values consistently
   */
  private parsePnL(value: any): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[$,]/g, ''))
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  /**
   * Debug function to check localStorage state
   */
  debugState() {
    console.log('=== ModelStatsService Debug State ===')
    console.log('Assignments Key:', ASSIGNMENTS_KEY)
    console.log('Stats Cache Key:', STATS_CACHE_KEY)
    console.log('LocalStorage Assignments:', localStorage.getItem(ASSIGNMENTS_KEY))
    console.log('LocalStorage Stats Cache:', localStorage.getItem(STATS_CACHE_KEY))
    console.log('Service assignments:', this.assignments)
    console.log('Service stats cache:', this.statsCache)
    console.log('=====================================')
  }

  /**
   * Get summary stats across all models
   */
  getSummaryStats(tradesData: any[]) {
    console.log('getSummaryStats called with trades:', tradesData.length)
    this.debugState()
    
    let bestPerforming: { modelId: string; name: string; stats: ModelStats } | null = null
    let leastPerforming: { modelId: string; name: string; stats: ModelStats } | null = null
    let mostActive: { modelId: string; name: string; stats: ModelStats } | null = null
    let bestWinRate: { modelId: string; name: string; stats: ModelStats } | null = null

    // Get all strategies from localStorage
    try {
      const strategiesRaw = localStorage.getItem('tradestial:strategies')
      const strategies = strategiesRaw ? JSON.parse(strategiesRaw) : []
      console.log('Found strategies:', strategies.length)

      for (const strategy of strategies) {
        const stats = this.getModelStats(strategy.id, tradesData)
        console.log(`Stats for ${strategy.name}:`, stats)
        const modelData = { modelId: strategy.id, name: strategy.name, stats }

        // Best performing (highest net P&L)
        if (!bestPerforming || stats.netPnL > bestPerforming.stats.netPnL) {
          bestPerforming = modelData
        }

        // Least performing (lowest net P&L)
        if (!leastPerforming || stats.netPnL < leastPerforming.stats.netPnL) {
          leastPerforming = modelData
        }

        // Most active (most trades)
        if (!mostActive || stats.total > mostActive.stats.total) {
          mostActive = modelData
        }

        // Best win rate (highest win rate with at least 1 trade)
        if (stats.total > 0 && (!bestWinRate || stats.winRate > bestWinRate.stats.winRate)) {
          bestWinRate = modelData
        }
      }
    } catch (error) {
      console.warn('Failed to calculate summary stats:', error)
    }

    return {
      bestPerforming,
      leastPerforming,
      mostActive,
      bestWinRate
    }
  }
}

// Export singleton instance
export const modelStatsService = ModelStatsService.getInstance()

// Make debugging available globally for troubleshooting
if (typeof window !== 'undefined') {
  (window as any).debugModelStats = () => {
    modelStatsService.debugState()
    console.log('Use window.debugModelStats() to see this info')
  }
}