/**
 * Privacy utility functions for masking sensitive financial data
 */

export function maskPnLValue(value: number | string, isPrivacyMode: boolean): string {
  if (!isPrivacyMode) {
    return typeof value === 'number' ? value.toString() : value
  }
  
  // Always use exactly 4 asterisks for consistency
  return '****'
}

export function maskCurrencyValue(
  value: number, 
  isPrivacyMode: boolean, 
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  if (!isPrivacyMode) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(value)
  }
  
  // For currency values, show currency symbol with asterisks
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  
  // Get currency symbol
  const parts = formatter.formatToParts(0)
  const currencySymbol = parts.find(part => part.type === 'currency')?.value || '$'
  
  // Always use exactly 4 asterisks for consistency
  return `${currencySymbol}****`
}

export function maskPercentageValue(value: number, isPrivacyMode: boolean): string {
  if (!isPrivacyMode) {
    return `${value.toFixed(1)}%`
  }
  
  // Always use exactly 4 asterisks for consistency
  return '****%'
}

export function maskRMultipleValue(value: number, isPrivacyMode: boolean): string {
  if (!isPrivacyMode) {
    return `${value.toFixed(2)}R`
  }
  
  return '****R'
}

export function maskTicksValue(value: number, isPrivacyMode: boolean): string {
  if (!isPrivacyMode) {
    return `${value} ticks`
  }
  
  return '**** ticks'
}

export function maskPipsValue(value: number, isPrivacyMode: boolean): string {
  if (!isPrivacyMode) {
    return `${value.toFixed(1)} pips`
  }
  
  return '**** pips'
}

export function maskPointsValue(value: number, isPrivacyMode: boolean): string {
  if (!isPrivacyMode) {
    return `${value} pts`
  }
  
  return '**** pts'
}
