// Simple instrument configuration and helpers (no API keys required)
// Extend as needed for more accurate multipliers and tick sizes.

// Normalize a raw broker/exchange symbol to a root for multiplier mapping
// Examples:
//  - CME_MINI:NQU2025 -> NQ
//  - MESZ24 -> MES
//  - ESU4 -> ES
//  - BINANCE:BTCUSDT -> BTCUSDT (falls through to default 1)
export function normalizeSymbolRoot(raw?: string): string {
  if (!raw) return ''
  let s = raw.trim().toUpperCase()
  // Strip common exchange prefixes before ':'
  if (s.includes(':')) s = s.split(':').pop() as string
  // Remove separators
  s = s.replace(/[\._\-]/g, '')
  // For futures, take leading letters until a digit appears (keeps MES/MNQ/ES/NQ/YM/CL etc.)
  const m = s.match(/^[A-Z]+/)
  return m ? m[0] : s
}

export type ExchangeInfo = {
  timeZone: string // IANA tz
  session: 'cme_futures' | 'equity_regular' | 'twenty_four_hour'
}

// Very small mapping; extend as needed
export function getExchangeInfo(symbol?: string): ExchangeInfo {
  const root = normalizeSymbolRoot(symbol)
  // CME equity index futures (and micros) + CL crude (NYMEX under CME) use CME session 17:00-16:00 America/Chicago
  if (root === 'ES' || root === 'MES' || root === 'NQ' || root === 'MNQ' || root === 'YM' || root === 'MYM' || root === 'CL' || root === 'MCL' || root === 'GC' || root === 'MGC' || root === 'RTY' || root === 'M2K' || root === 'SI' || root === 'MSI') {
    return { timeZone: 'America/Chicago', session: 'cme_futures' }
  }
  // US equities default
  if (/^[A-Z]{1,5}$/.test(root)) {
    return { timeZone: 'America/New_York', session: 'equity_regular' }
  }
  // Crypto 24h as fallback
  return { timeZone: 'UTC', session: 'twenty_four_hour' }
}

export function getMultiplier(symbol: string | undefined): number {
  if (!symbol) return 1
  const root = normalizeSymbolRoot(symbol)
  // Futures (common minis/micros)
  if (root === 'ES' || root.startsWith('ES')) return 50
  if (root === 'MES' || root.startsWith('MES')) return 5
  if (root === 'NQ' || root.startsWith('NQ')) return 20
  if (root === 'MNQ' || root.startsWith('MNQ')) return 2
  if (root === 'YM' || root.startsWith('YM')) return 5
  if (root === 'MYM' || root.startsWith('MYM')) return 0.5
  if (root === 'CL' || root.startsWith('CL')) return 1000 // $1000 per point
  if (root === 'MCL' || root.startsWith('MCL')) return 100
  // Metals
  if (root === 'GC' || root.startsWith('GC')) return 100 // $100 per 1.0 move
  if (root === 'MGC' || root.startsWith('MGC')) return 10
  if (root === 'SI' || root.startsWith('SI')) return 5000 // $5000 per 1.0 move
  if (root === 'MSI' || root.startsWith('MSI')) return 1000
  // Russell 2000
  if (root === 'RTY' || root.startsWith('RTY')) return 50
  if (root === 'M2K' || root.startsWith('M2K')) return 5

  // Stocks/ETFs/CFDs/crypto default
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



