/**
 * Forex utilities for pip calculations, pair normalization, and lot conversions
 */

// Standard forex pair configurations
const FOREX_PAIRS: Record<string, {
  pipPosition: number // decimal places for 1 pip
  lotSize: number     // standard lot size in base currency units
  baseFirst: boolean  // true if base currency is first in pair
}> = {
  // Major pairs
  'EURUSD': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'GBPUSD': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'USDJPY': { pipPosition: 2, lotSize: 100000, baseFirst: true },
  'USDCHF': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'AUDUSD': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'USDCAD': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'NZDUSD': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  
  // Cross pairs
  'EURJPY': { pipPosition: 2, lotSize: 100000, baseFirst: true },
  'GBPJPY': { pipPosition: 2, lotSize: 100000, baseFirst: true },
  'EURGBP': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'EURAUD': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'EURCHF': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'AUDJPY': { pipPosition: 2, lotSize: 100000, baseFirst: true },
  'CHFJPY': { pipPosition: 2, lotSize: 100000, baseFirst: true },
  'GBPAUD': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'GBPCHF': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'AUDCAD': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'CADCHF': { pipPosition: 4, lotSize: 100000, baseFirst: true },
  'CADJPY': { pipPosition: 2, lotSize: 100000, baseFirst: true },
  'NZDJPY': { pipPosition: 2, lotSize: 100000, baseFirst: true },
}

/**
 * Normalize forex pair symbol to standard format
 * Examples: EUR/USD -> EURUSD, EUR_USD -> EURUSD, eur-usd -> EURUSD
 */
export function normalizeForexPair(symbol: string): string {
  if (!symbol) return ''
  
  // Remove common separators and convert to uppercase
  const normalized = symbol.replace(/[\/\-_]/g, '').toUpperCase()
  
  // Validate it looks like a forex pair (6 characters)
  if (!/^[A-Z]{6}$/.test(normalized)) return symbol.toUpperCase()
  
  return normalized
}

/**
 * Check if a symbol is a recognized forex pair
 */
export function isForexPair(symbol: string): boolean {
  const normalized = normalizeForexPair(symbol)
  return FOREX_PAIRS.hasOwnProperty(normalized)
}

/**
 * Get pip size for a forex pair (e.g., 0.0001 for EURUSD, 0.01 for USDJPY)
 */
export function getPipSize(pair: string): number {
  const normalized = normalizeForexPair(pair)
  const config = FOREX_PAIRS[normalized]
  
  if (!config) {
    // Default to 4 decimal places for unknown pairs
    return 0.0001
  }
  
  return Math.pow(10, -config.pipPosition)
}

/**
 * Calculate pip difference between two prices
 */
export function calculatePips(pair: string, entryPrice: number, exitPrice: number): number {
  const pipSize = getPipSize(pair)
  const priceDiff = Math.abs(exitPrice - entryPrice)
  return Math.round(priceDiff / pipSize)
}

/**
 * Calculate pip value in account currency (assumes USD account)
 * For pairs like EURUSD: pip value = (pip size / exchange rate) * lot size
 * For pairs like USDJPY: pip value = pip size * lot size
 */
export function calculatePipValue(
  pair: string, 
  lotSize: number, 
  exchangeRate: number,
  accountCurrency: string = 'USD'
): number {
  const normalized = normalizeForexPair(pair)
  const config = FOREX_PAIRS[normalized]
  
  if (!config) return 1 // Default pip value
  
  const pipSize = getPipSize(pair)
  const standardLotSize = config.lotSize
  const actualUnits = lotSize * standardLotSize
  
  // For JPY pairs, pip value calculation is different
  if (pair.includes('JPY')) {
    if (pair.startsWith('USD')) {
      // USDJPY: pip value = pip size * lot size
      return pipSize * actualUnits
    } else {
      // EURJPY, GBPJPY etc: pip value = (pip size * lot size) / USD exchange rate
      return (pipSize * actualUnits) / exchangeRate
    }
  }
  
  // For USD base pairs (USDCHF, USDCAD)
  if (pair.startsWith('USD')) {
    return pipSize * actualUnits
  }
  
  // For USD quote pairs (EURUSD, GBPUSD)
  if (pair.endsWith('USD')) {
    return pipSize * actualUnits
  }
  
  // For cross pairs, need to convert to account currency
  return (pipSize * actualUnits) / exchangeRate
}

/**
 * Convert lot size to units
 */
export function lotsToUnits(pair: string, lots: number): number {
  const normalized = normalizeForexPair(pair)
  const config = FOREX_PAIRS[normalized]
  
  if (!config) return lots * 100000 // Default standard lot
  
  return lots * config.lotSize
}

/**
 * Convert units to lot size
 */
export function unitsToLots(pair: string, units: number): number {
  const normalized = normalizeForexPair(pair)
  const config = FOREX_PAIRS[normalized]
  
  if (!config) return units / 100000 // Default standard lot
  
  return units / config.lotSize
}

/**
 * Get base and quote currencies from a pair
 */
export function getPairCurrencies(pair: string): { base: string; quote: string } {
  const normalized = normalizeForexPair(pair)
  
  if (normalized.length !== 6) {
    return { base: '', quote: '' }
  }
  
  return {
    base: normalized.substring(0, 3),
    quote: normalized.substring(3, 6)
  }
}

/**
 * Calculate position size in lots for a given risk amount
 */
export function calculatePositionSize(
  pair: string,
  accountBalance: number,
  riskPercent: number,
  stopLossPips: number,
  exchangeRate: number = 1
): number {
  const riskAmount = accountBalance * (riskPercent / 100)
  const pipValue = calculatePipValue(pair, 1, exchangeRate) // Per standard lot
  
  if (pipValue === 0 || stopLossPips === 0) return 0
  
  const maxLots = riskAmount / (stopLossPips * pipValue)
  return Math.max(0.01, Math.round(maxLots * 100) / 100) // Round to 2 decimal places, min 0.01
}

/**
 * Format lot size for display
 */
export function formatLots(lots: number): string {
  if (lots >= 1) {
    return lots.toFixed(2)
  } else if (lots >= 0.1) {
    return lots.toFixed(2)
  } else {
    return lots.toFixed(3)
  }
}
