export interface Trade {
  id: string
  openDate: string
  symbol: string
  status: 'WIN' | 'LOSS'
  closeDate: string
  entryPrice: number
  exitPrice: number
  netPnl: number
  netRoi: number
  entryTime?: string
  exitTime?: string
  contractsTraded?: number
  adjustedCost?: number
  mae?: number // Maximum Adverse Excursion
  mfe?: number // Maximum Favorable Excursion
  zellaInsights?: string
  zellaScale?: number
  side?: 'LONG' | 'SHORT'
  points?: number
  ticks?: number
  ticksPerContract?: number
  commissions?: number
  grossPnl?: number
  playbook?: string
  priceMae?: number
  priceMfe?: number
  runningPnl?: RunningPnlPoint[] | null
  tradeRating?: number
  profitTarget?: number
  stopLoss?: number
  averageEntry?: number
  averageExit?: number
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
}

export interface RunningPnlPoint {
  time: string
  value: number
}

// Mock data - in production this would come from an API
const mockTrades: Trade[] = [
  {
    id: '09-01-2025',
    symbol: 'NQ',
    openDate: 'Tue, Aug 12, 2025',
    closeDate: 'Tue, Aug 12, 2025',
    netPnl: 2025,
    side: 'LONG',
    contractsTraded: 101,
    points: 25,
    ticks: 405.0,
    ticksPerContract: 405.0,
    commissions: 0,
    netRoi: 0.43,
    grossPnl: 2025,
    adjustedCost: 474440,
    playbook: 'ICT 2022 Model',
    zellaScale: 0,
    priceMae: 23617,
    priceMfe: 23967.25,
    runningPnl: null,
    tradeRating: 5,
    profitTarget: 0,
    stopLoss: 0,
    averageEntry: 23722,
    averageExit: 23823.25,
    entryTime: '19:48:37',
    exitTime: '20:40:37',
    status: 'WIN',
    entryPrice: 23722,
    exitPrice: 23823.25
  },
  {
    id: '1',
    openDate: '08/07/2025',
    symbol: 'NQ',
    status: 'WIN',
    closeDate: '08/07/2025',
    entryPrice: 23617.25,
    exitPrice: 23619.25,
    netPnl: 356.4,
    netRoi: 0.01,
    entryTime: '07:18:55',
    exitTime: '07:21:03',
    contractsTraded: 10,
    adjustedCost: 4723450,
    mae: 23617,
    mfe: 23626.25,
    zellaInsights: '',
    zellaScale: 5
  },
  {
    id: '2',
    openDate: '08/07/2025',
    symbol: 'NQ',
    status: 'LOSS',
    closeDate: '08/07/2025',
    entryPrice: 23608.25,
    exitPrice: 23607,
    netPnl: -1022.96,
    netRoi: -0.05,
    entryTime: '08:15:12',
    exitTime: '08:19:45',
    contractsTraded: 3,
    adjustedCost: 523450,
    mae: 23605.5,
    mfe: 23610.0,
    zellaInsights: '',
    zellaScale: 2
  }
]

// Mock running P&L data
const mockRunningPnlData: RunningPnlPoint[] = [
  { time: '19:48', value: 0 },
  { time: '19:49', value: -200 },
  { time: '19:50', value: -400 },
  { time: '19:52', value: -150 },
  { time: '19:55', value: 300 },
  { time: '19:58', value: 500 },
  { time: '20:00', value: 200 },
  { time: '20:03', value: 800 },
  { time: '20:05', value: 600 },
  { time: '20:08', value: 1200 },
  { time: '20:15', value: 1400 },
  { time: '20:20', value: 1100 },
  { time: '20:25', value: 1600 },
  { time: '20:30', value: 1800 },
  { time: '20:35', value: 2100 },
  { time: '20:40', value: 2025 }
]

export class TradeDataService {
  // Get all trades
  static async getAllTrades(): Promise<Trade[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    return mockTrades
  }

  // Get trade by ID
  static async getTradeById(id: string): Promise<Trade | null> {
    await new Promise(resolve => setTimeout(resolve, 50))
    return mockTrades.find(trade => trade.id === id) || null
  }

  // Get trades by symbol
  static async getTradesBySymbol(symbol: string): Promise<Trade[]> {
    await new Promise(resolve => setTimeout(resolve, 50))
    return mockTrades.filter(trade => trade.symbol === symbol)
  }

  // Get running P&L data for a trade
  static async getRunningPnlData(): Promise<RunningPnlPoint[]> {
    await new Promise(resolve => setTimeout(resolve, 50))
    // In production, this would be trade-specific data
    return mockRunningPnlData
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
  static calculateMetrics(trades: Trade[]): TradeMetrics {
    const totalTrades = trades.length
    const netCumulativePnl = trades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const winningTrades = trades.filter(trade => trade.status === 'WIN').length
    const losingTrades = trades.filter(trade => trade.status === 'LOSS').length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    
    // Calculate average win and loss amounts
    const totalWinAmount = trades
      .filter(trade => trade.status === 'WIN')
      .reduce((sum, trade) => sum + trade.netPnl, 0)
    const totalLossAmount = Math.abs(trades
      .filter(trade => trade.status === 'LOSS')
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