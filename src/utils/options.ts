/**
 * Options utilities for parsing option symbols, calculating DTE, and handling option-specific data
 */

export interface OptionDetails {
  underlying: string
  expiration: Date
  strike: number
  optionType: 'CALL' | 'PUT'
  dte?: number // Days to expiration
}

/**
 * Parse option symbol in various formats
 * Examples:
 * - AAPL240315C00150000 (OCC format)
 * - AAPL 240315 C 150 (space separated)
 * - AAPL_240315C150 (underscore format)
 * - AAPL Mar 15 2024 150 Call
 */
export function parseOptionSymbol(symbol: string): OptionDetails | null {
  if (!symbol) return null
  
  const normalized = symbol.trim().toUpperCase()
  
  // OCC format: AAPL240315C00150000
  const occMatch = normalized.match(/^([A-Z]{1,5})(\d{6})([CP])(\d{8})$/)
  if (occMatch) {
    const [, underlying, dateStr, type, strikeStr] = occMatch
    const expiration = parseOCCDate(dateStr)
    const strike = parseInt(strikeStr) / 1000 // Strike is in thousandths
    
    return {
      underlying,
      expiration,
      strike,
      optionType: type === 'C' ? 'CALL' : 'PUT'
    }
  }
  
  // Space/underscore separated format: AAPL 240315 C 150
  const separatedMatch = normalized.match(/^([A-Z]{1,5})[\s_]+(\d{6})[\s_]*([CP])[\s_]*(\d+(?:\.\d+)?)/)
  if (separatedMatch) {
    const [, underlying, dateStr, type, strikeStr] = separatedMatch
    const expiration = parseOCCDate(dateStr)
    const strike = parseFloat(strikeStr)
    
    return {
      underlying,
      expiration,
      strike,
      optionType: type === 'C' ? 'CALL' : 'PUT'
    }
  }
  
  // Text format: AAPL Mar 15 2024 150 Call
  const textMatch = normalized.match(/^([A-Z]{1,5})\s+(\w{3})\s+(\d{1,2})\s+(\d{4})\s+(\d+(?:\.\d+)?)\s+(CALL|PUT)/)
  if (textMatch) {
    const [, underlying, monthStr, dayStr, yearStr, strikeStr, typeStr] = textMatch
    const month = getMonthNumber(monthStr)
    if (month === -1) return null
    
    const expiration = new Date(parseInt(yearStr), month, parseInt(dayStr))
    const strike = parseFloat(strikeStr)
    
    return {
      underlying,
      expiration,
      strike,
      optionType: typeStr as 'CALL' | 'PUT'
    }
  }
  
  return null
}

/**
 * Parse OCC date format (YYMMDD) to Date object
 */
function parseOCCDate(dateStr: string): Date {
  if (dateStr.length !== 6) throw new Error('Invalid OCC date format')
  
  const year = parseInt(dateStr.substring(0, 2))
  const month = parseInt(dateStr.substring(2, 4)) - 1 // Month is 0-indexed
  const day = parseInt(dateStr.substring(4, 6))
  
  // Assume 20xx for years 00-99
  const fullYear = year < 50 ? 2000 + year : 1900 + year
  
  return new Date(fullYear, month, day)
}

/**
 * Get month number from month abbreviation
 */
function getMonthNumber(monthStr: string): number {
  const months: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  }
  
  return months[monthStr.toUpperCase()] ?? -1
}

/**
 * Calculate days to expiration from current date
 */
export function calculateDTE(expirationDate: Date, currentDate: Date = new Date()): number {
  const timeDiff = expirationDate.getTime() - currentDate.getTime()
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
}

/**
 * Check if option is expired
 */
export function isExpired(expirationDate: Date, currentDate: Date = new Date()): boolean {
  return expirationDate < currentDate
}

/**
 * Format option symbol for display
 */
export function formatOptionSymbol(details: OptionDetails): string {
  const { underlying, expiration, strike, optionType } = details
  const dateStr = expiration.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
  
  return `${underlying} ${dateStr} ${strike} ${optionType}`
}

/**
 * Generate OCC format symbol from option details
 */
export function generateOCCSymbol(details: OptionDetails): string {
  const { underlying, expiration, strike, optionType } = details
  
  // Format date as YYMMDD
  const year = expiration.getFullYear().toString().slice(-2)
  const month = (expiration.getMonth() + 1).toString().padStart(2, '0')
  const day = expiration.getDate().toString().padStart(2, '0')
  const dateStr = year + month + day
  
  // Format strike as 8-digit integer (in thousandths)
  const strikeStr = Math.round(strike * 1000).toString().padStart(8, '0')
  
  // Option type
  const typeChar = optionType === 'CALL' ? 'C' : 'P'
  
  return `${underlying}${dateStr}${typeChar}${strikeStr}`
}

/**
 * Determine if option is ITM, ATM, or OTM
 */
export function getMoneyness(
  strike: number, 
  underlyingPrice: number, 
  optionType: 'CALL' | 'PUT'
): 'ITM' | 'ATM' | 'OTM' {
  const tolerance = 0.01 // Consider ATM if within 1 cent
  
  if (Math.abs(strike - underlyingPrice) <= tolerance) {
    return 'ATM'
  }
  
  if (optionType === 'CALL') {
    return underlyingPrice > strike ? 'ITM' : 'OTM'
  } else {
    return underlyingPrice < strike ? 'ITM' : 'OTM'
  }
}

/**
 * Calculate intrinsic value of option
 */
export function calculateIntrinsicValue(
  strike: number, 
  underlyingPrice: number, 
  optionType: 'CALL' | 'PUT'
): number {
  if (optionType === 'CALL') {
    return Math.max(0, underlyingPrice - strike)
  } else {
    return Math.max(0, strike - underlyingPrice)
  }
}

/**
 * Estimate time value of option (premium - intrinsic value)
 */
export function calculateTimeValue(
  premium: number,
  strike: number,
  underlyingPrice: number,
  optionType: 'CALL' | 'PUT'
): number {
  const intrinsicValue = calculateIntrinsicValue(strike, underlyingPrice, optionType)
  return Math.max(0, premium - intrinsicValue)
}

/**
 * Get standard option expiration dates (3rd Friday of month)
 */
export function getStandardExpirationDate(year: number, month: number): Date {
  // Find 3rd Friday of the month
  const firstDay = new Date(year, month - 1, 1)
  const firstFriday = new Date(year, month - 1, 1 + (5 - firstDay.getDay() + 7) % 7)
  return new Date(year, month - 1, firstFriday.getDate() + 14)
}

/**
 * Check if date is a standard monthly expiration (3rd Friday)
 */
export function isStandardExpiration(date: Date): boolean {
  const standardExp = getStandardExpirationDate(date.getFullYear(), date.getMonth() + 1)
  return date.getTime() === standardExp.getTime()
}
