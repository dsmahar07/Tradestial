// Comprehensive instrument configuration and helpers
// Supports futures, forex, options, indices, bonds, and crypto

// Normalize a raw broker/exchange symbol to a root for multiplier mapping
// Examples:
//  - CME_MINI:NQU2025 -> NQ
//  - MESZ24 -> MES
//  - ESU4 -> ES
//  - BINANCE:BTCUSDT -> BTCUSDT
//  - EURUSD -> EURUSD
//  - AAPL240315C00150000 -> AAPL (options)
export function normalizeSymbolRoot(raw?: string): string {
  if (!raw) return ''
  let s = raw.trim().toUpperCase()
  
  // Strip common exchange prefixes before ':'
  if (s.includes(':')) s = s.split(':').pop() as string
  
  // Handle forex pairs (keep full pair name)
  if (isForexPair(s)) return s
  
  // Handle options (extract underlying)
  const optionMatch = s.match(/^([A-Z]{1,5})\d{6}[CP]\d+$/)
  if (optionMatch) return optionMatch[1]
  
  // Remove separators for futures
  s = s.replace(/[\._\-]/g, '')
  
  // For futures, take leading letters until a digit appears
  const m = s.match(/^[A-Z]+/)
  return m ? m[0] : s
}

// Check if symbol looks like a forex pair
function isForexPair(symbol: string): boolean {
  // Common forex pair patterns: EURUSD, GBPJPY, etc.
  return /^[A-Z]{6}$/.test(symbol) || 
         /^[A-Z]{3}\/[A-Z]{3}$/.test(symbol) ||
         /^[A-Z]{3}_[A-Z]{3}$/.test(symbol)
}

// Infer instrument type from symbol
export function inferInstrumentType(symbol?: string): string {
  if (!symbol) return 'equity'
  
  const normalized = symbol.trim().toUpperCase()
  const root = normalizeSymbolRoot(normalized)
  
  // Forex pairs
  if (isForexPair(normalized)) return 'forex'
  
  // Options (various formats)
  if (/\d{6}[CP]\d+/.test(normalized) || 
      normalized.includes('CALL') || 
      normalized.includes('PUT')) return 'option'
  
  // Crypto patterns
  if (normalized.includes('BTC') || 
      normalized.includes('ETH') || 
      normalized.includes('USDT') ||
      normalized.includes('BINANCE:') ||
      normalized.includes('COINBASE:')) return 'crypto'
  
  // Futures by root symbol
  const futuresRoots = new Set([
    // Equity Index Futures
    'ES', 'MES', 'NQ', 'MNQ', 'YM', 'MYM', 'RTY', 'M2K',
    // Energy
    'CL', 'MCL', 'NG', 'RB', 'HO',
    // Metals
    'GC', 'MGC', 'SI', 'MSI', 'HG', 'PL',
    // Agricultural
    'ZC', 'ZS', 'ZW', 'KC', 'SB', 'CT',
    // Currency Futures
    '6E', '6B', '6J', '6A', '6C', '6S', '6N', '6M',
    // Interest Rates/Bonds
    'ZN', 'ZB', 'ZF', 'ZT', 'UB', 'TN'
  ])
  
  if (futuresRoots.has(root)) return 'future'
  
  // Default to equity for single letter symbols or unknown
  return 'equity'
}

export type ExchangeInfo = {
  timeZone: string // IANA tz
  session: 'cme_futures' | 'equity_regular' | 'twenty_four_hour'
}

// Comprehensive exchange mapping for all instrument types
export function getExchangeInfo(symbol?: string): ExchangeInfo {
  const root = normalizeSymbolRoot(symbol)
  const instrumentType = inferInstrumentType(symbol)
  
  // CME Futures (equity indices, energy, metals, agricultural, bonds/IR)
  const cmeFutures = new Set([
    'ES', 'MES', 'NQ', 'MNQ', 'YM', 'MYM', 'RTY', 'M2K', // Equity indices
    'CL', 'MCL', 'NG', 'RB', 'HO', // Energy
    'GC', 'MGC', 'SI', 'MSI', 'HG', 'PL', // Metals
    'ZC', 'ZS', 'ZW', 'KC', 'SB', 'CT', // Agricultural
    'ZN', 'ZB', 'ZF', 'ZT', 'UB', 'TN', // Interest Rates/Bonds
    '6E', '6B', '6J', '6A', '6C', '6S', '6N', '6M' // Currency futures
  ])
  
  if (cmeFutures.has(root)) {
    return { timeZone: 'America/Chicago', session: 'cme_futures' }
  }
  
  // Forex pairs - 24 hour markets
  if (instrumentType === 'forex') {
    return { timeZone: 'UTC', session: 'twenty_four_hour' }
  }
  
  // Crypto - 24 hour markets
  if (instrumentType === 'crypto') {
    return { timeZone: 'UTC', session: 'twenty_four_hour' }
  }
  
  // US equities and options
  if (instrumentType === 'equity' || instrumentType === 'option') {
    return { timeZone: 'America/New_York', session: 'equity_regular' }
  }
  
  // Default fallback
  return { timeZone: 'UTC', session: 'twenty_four_hour' }
}

// Comprehensive multiplier mapping for all futures contracts
const FUTURES_MULTIPLIERS: Record<string, number> = {
  // Equity Index Futures
  'ES': 50,     // E-mini S&P 500
  'MES': 5,     // Micro E-mini S&P 500
  'NQ': 20,     // E-mini NASDAQ-100
  'MNQ': 2,     // Micro E-mini NASDAQ-100
  'YM': 5,      // E-mini Dow Jones
  'MYM': 0.5,   // Micro E-mini Dow Jones
  'RTY': 50,    // E-mini Russell 2000
  'M2K': 5,     // Micro E-mini Russell 2000
  
  // Energy
  'CL': 1000,   // Crude Oil ($1000 per point)
  'MCL': 100,   // Micro Crude Oil
  'NG': 10000,  // Natural Gas ($10,000 per point)
  'RB': 42000,  // RBOB Gasoline (42,000 gallons)
  'HO': 42000,  // Heating Oil (42,000 gallons)
  
  // Metals
  'GC': 100,    // Gold ($100 per 1.0 move)
  'MGC': 10,    // Micro Gold
  'SI': 5000,   // Silver ($5000 per 1.0 move)
  'MSI': 1000,  // Micro Silver
  'HG': 25000,  // Copper (25,000 lbs)
  'PL': 50,     // Platinum (50 troy oz)
  
  // Agricultural
  'ZC': 50,     // Corn (5,000 bushels, $0.01 = $50)
  'ZS': 50,     // Soybeans (5,000 bushels, $0.01 = $50)
  'ZW': 50,     // Wheat (5,000 bushels, $0.01 = $50)
  'KC': 375,    // Coffee (37,500 lbs)
  'SB': 1120,   // Sugar (112,000 lbs)
  'CT': 500,    // Cotton (50,000 lbs)
  
  // Interest Rates/Bonds
  'ZN': 1000,   // 10-Year Treasury Note ($1000 per point)
  'ZB': 1000,   // 30-Year Treasury Bond ($1000 per point)
  'ZF': 1000,   // 5-Year Treasury Note ($1000 per point)
  'ZT': 2000,   // 2-Year Treasury Note ($2000 per point)
  'UB': 1000,   // Ultra Treasury Bond ($1000 per point)
  'TN': 1000,   // 10-Year Treasury Note ($1000 per point)
  
  // Currency Futures
  '6E': 125000, // Euro (125,000 EUR)
  '6B': 62500,  // British Pound (62,500 GBP)
  '6J': 12500000, // Japanese Yen (12,500,000 JPY)
  '6A': 100000, // Australian Dollar (100,000 AUD)
  '6C': 100000, // Canadian Dollar (100,000 CAD)
  '6S': 125000, // Swiss Franc (125,000 CHF)
  '6N': 100000, // New Zealand Dollar (100,000 NZD)
  '6M': 500000, // Mexican Peso (500,000 MXN)
}

export function getMultiplier(symbol: string | undefined): number {
  if (!symbol) return 1
  
  const root = normalizeSymbolRoot(symbol)
  const instrumentType = inferInstrumentType(symbol)
  
  // Futures multipliers
  if (instrumentType === 'future' && FUTURES_MULTIPLIERS[root]) {
    return FUTURES_MULTIPLIERS[root]
  }
  
  // Options on equities typically have 100 share multiplier
  if (instrumentType === 'option') {
    return 100
  }
  
  // Forex, crypto, stocks default to 1
  return 1
}

export function sideSign(side: string | undefined): 1 | -1 {
  if (!side) return 1
  const s = side.toUpperCase()
  return s.includes('SHORT') ? -1 : 1
}

export type Bar = {
  time: string // ISO
  open: number
  high: number
  low: number
  close: number
  volume?: number
}



