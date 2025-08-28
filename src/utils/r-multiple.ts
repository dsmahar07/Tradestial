/**
 * R-Multiple calculation utilities for trading analytics
 */

import { Trade } from '@/services/trade-data.service'

export interface RMultipleMetrics {
  avgPlannedRMultiple: number
  avgRealizedRMultiple: number
  totalPlannedRMultiple: number
  totalRealizedRMultiple: number
  tradesWithValidSLTP: number
  totalTrades: number
  rMultipleDistribution: {
    range: string
    planned: number
    realized: number
  }[]
}

/**
 * Calculate R-Multiple for a single trade
 */
export function calculateTradeRMultiple(trade: Trade, metadata?: { profitTarget?: string; stopLoss?: string }): {
  plannedRMultiple: number | null
  realizedRMultiple: number | null
  tradeRisk: number | null
  initialTarget: number | null
} {
  // Get SL/TP from metadata or trade properties
  const profitTargetRaw = metadata?.profitTarget || trade.profitTarget?.toString() || trade.initialTarget?.toString()
  const stopLossRaw = metadata?.stopLoss || trade.stopLoss?.toString()

  // Entry and stop are required to compute risk (for realized/ planned)
  if (!stopLossRaw || !trade.entryPrice || trade.netPnl === undefined) {
    return {
      plannedRMultiple: null,
      realizedRMultiple: null,
      tradeRisk: null,
      initialTarget: null
    }
  }

  const avgEntry = trade.entryPrice
  const stopPrice = parseFloat(stopLossRaw.toString().replace(/[$,]/g, ''))
  const netPnl = trade.netPnl

  if (isNaN(avgEntry) || isNaN(stopPrice)) {
    return {
      plannedRMultiple: null,
      realizedRMultiple: null,
      tradeRisk: null,
      initialTarget: null
    }
  }

  // Calculate based on trade side (LONG/SHORT)
  const isLong = trade.side !== 'SHORT'

  // Risk only depends on entry and stop
  const tradeRisk = Math.abs(isLong ? avgEntry - stopPrice : stopPrice - avgEntry)

  // Compute planned only if we have a profit target
  let plannedRMultiple: number | null = null
  let initialTarget: number | null = null
  if (profitTargetRaw) {
    const targetPrice = parseFloat(profitTargetRaw.toString().replace(/[$,]/g, ''))
    if (!isNaN(targetPrice)) {
      initialTarget = isLong ? targetPrice - avgEntry : avgEntry - targetPrice
      plannedRMultiple = tradeRisk > 0 ? initialTarget / tradeRisk : null
    }
  }

  // Realized R-Multiple = Net P&L / Trade Risk (available with stop only)
  const realizedRMultiple = tradeRisk > 0 ? netPnl / tradeRisk : null

  return {
    plannedRMultiple,
    realizedRMultiple,
    tradeRisk: tradeRisk || null,
    initialTarget
  }
}

/**
 * Calculate aggregate R-Multiple metrics for a collection of trades
 */
export function calculateRMultipleMetrics(
  trades: Trade[], 
  getTradeMetadata?: (tradeId: string) => { profitTarget?: string; stopLoss?: string } | null
): RMultipleMetrics {
  let totalPlannedRMultiple = 0
  let totalRealizedRMultiple = 0
  let plannedCount = 0
  let realizedCount = 0
  
  const plannedRMultiples: number[] = []
  const realizedRMultiples: number[] = []

  trades.forEach(trade => {
    const metadata = getTradeMetadata ? getTradeMetadata(trade.id) : null
    const r = calculateTradeRMultiple(trade, metadata || undefined)
    
    if (r.plannedRMultiple !== null) {
      totalPlannedRMultiple += r.plannedRMultiple
      plannedRMultiples.push(r.plannedRMultiple)
      plannedCount++
    }
    if (r.realizedRMultiple !== null) {
      totalRealizedRMultiple += r.realizedRMultiple
      realizedRMultiples.push(r.realizedRMultiple)
      realizedCount++
    }
  })

  const avgPlannedRMultiple = plannedCount > 0 ? totalPlannedRMultiple / plannedCount : 0
  const avgRealizedRMultiple = realizedCount > 0 ? totalRealizedRMultiple / realizedCount : 0

  // Create R-Multiple distribution ranges
  const ranges = [
    '< -2R',
    '-2R to -1R', 
    '-1R to 0R',
    '0R to 1R',
    '1R to 2R',
    '2R to 3R',
    '> 3R'
  ]

  const rMultipleDistribution = ranges.map(range => {
    const plannedInRange = plannedRMultiples.filter(r => isInRange(r, range)).length
    const realizedInRange = realizedRMultiples.filter(r => isInRange(r, range)).length
    
    return {
      range,
      planned: plannedInRange,
      realized: realizedInRange
    }
  })

  return {
    avgPlannedRMultiple,
    avgRealizedRMultiple,
    totalPlannedRMultiple,
    totalRealizedRMultiple,
    tradesWithValidSLTP: plannedCount,
    totalTrades: trades.length,
    rMultipleDistribution
  }
}

/**
 * Helper function to check if R-Multiple value falls within a range
 */
function isInRange(value: number, range: string): boolean {
  switch (range) {
    case '< -2R':
      return value < -2
    case '-2R to -1R':
      return value >= -2 && value < -1
    case '-1R to 0R':
      return value >= -1 && value < 0
    case '0R to 1R':
      return value >= 0 && value < 1
    case '1R to 2R':
      return value >= 1 && value < 2
    case '2R to 3R':
      return value >= 2 && value < 3
    case '> 3R':
      return value >= 3
    default:
      return false
  }
}

/**
 * Format R-Multiple value for display
 */
export function formatRMultiple(value: number | null): string {
  if (value === null || isNaN(value)) return '--'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`
}

/**
 * Get R-Multiple color based on value
 */
export function getRMultipleColor(value: number | null): string {
  if (value === null || isNaN(value)) return 'text-gray-500'
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

/**
 * Calculate R-Multiple expectancy (average expected return per dollar risked)
 */
export function calculateRMultipleExpectancy(trades: Trade[], getTradeMetadata?: (tradeId: string) => { profitTarget?: string; stopLoss?: string } | null): {
  expectancy: number
  winRate: number
  avgWinR: number
  avgLossR: number
} {
  const realizedRMultiples: number[] = []
  
  trades.forEach(trade => {
    const metadata = getTradeMetadata ? getTradeMetadata(trade.id) : null
    const rMultipleData = calculateTradeRMultiple(trade, metadata || undefined)
    
    if (rMultipleData.realizedRMultiple !== null) {
      realizedRMultiples.push(rMultipleData.realizedRMultiple)
    }
  })

  if (realizedRMultiples.length === 0) {
    return { expectancy: 0, winRate: 0, avgWinR: 0, avgLossR: 0 }
  }

  const winningTrades = realizedRMultiples.filter(r => r > 0)
  const losingTrades = realizedRMultiples.filter(r => r < 0)
  
  const winRate = winningTrades.length / realizedRMultiples.length
  const avgWinR = winningTrades.length > 0 ? winningTrades.reduce((sum, r) => sum + r, 0) / winningTrades.length : 0
  const avgLossR = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, r) => sum + r, 0) / losingTrades.length) : 0
  
  // R-Multiple Expectancy = (Win Rate × Avg Win R) - (Loss Rate × Avg Loss R)
  const expectancy = (winRate * avgWinR) - ((1 - winRate) * avgLossR)

  return {
    expectancy,
    winRate,
    avgWinR,
    avgLossR
  }
}