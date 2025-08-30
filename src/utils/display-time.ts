/**
 * Display utilities for showing UTC-stored timestamps in user's local timezone
 */

import { convertFromUTC, getCurrentTimezone } from './timezones'

/**
 * Format a UTC date/datetime for display in user's local timezone
 * @param utcDatetime - UTC datetime string (ISO format or YYYY-MM-DD)
 * @param options - Display options
 * @returns Formatted string in user's local timezone
 */
export function formatDisplayTime(
  utcDatetime: string | undefined,
  options: {
    includeTime?: boolean
    includeSeconds?: boolean
    timezone?: number // Override timezone offset in minutes
    format?: 'short' | 'long' | 'relative'
  } = {}
): string {
  if (!utcDatetime) return ''
  
  const {
    includeTime = false,
    includeSeconds = false,
    timezone = getCurrentTimezone().value,
    format = 'short'
  } = options
  
  try {
    // Handle date-only strings (YYYY-MM-DD)
    if (!utcDatetime.includes('T') && !utcDatetime.includes(' ')) {
      const date = new Date(utcDatetime + 'T00:00:00.000Z')
      if (format === 'relative') {
        return formatRelativeDate(date)
      }
      return date.toLocaleDateString()
    }
    
    // Handle full datetime strings
    const utcIsoString = utcDatetime.includes('T') ? utcDatetime : utcDatetime + 'T00:00:00.000Z'
    const localDatetime = convertFromUTC(utcIsoString, timezone)
    
    if (!localDatetime) return utcDatetime
    
    const [datePart, timePart] = localDatetime.split(' ')
    
    if (format === 'relative') {
      const date = new Date(utcIsoString)
      return formatRelativeDate(date)
    }
    
    if (!includeTime) {
      return new Date(datePart).toLocaleDateString()
    }
    
    const timeDisplay = includeSeconds ? timePart : timePart.substring(0, 5)
    
    if (format === 'long') {
      return `${new Date(datePart).toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })} at ${timeDisplay}`
    }
    
    return `${new Date(datePart).toLocaleDateString()} ${timeDisplay}`
    
  } catch (error) {
    console.warn('Failed to format display time:', error, { utcDatetime, options })
    return utcDatetime
  }
}

/**
 * Format trade entry/exit times for display
 */
export function formatTradeTime(
  openDate: string,
  entryTime?: string,
  closeDate?: string,
  exitTime?: string,
  timezone?: number
): {
  entryDisplay: string
  exitDisplay: string
  durationDisplay: string
} {
  const tz = timezone ?? getCurrentTimezone().value
  
  const entryDateTime = entryTime ? `${openDate}T${entryTime}` : openDate
  const exitDateTime = exitTime && closeDate ? `${closeDate}T${exitTime}` : closeDate || openDate
  
  const entryDisplay = formatDisplayTime(entryDateTime, { 
    includeTime: !!entryTime, 
    timezone: tz 
  })
  
  const exitDisplay = formatDisplayTime(exitDateTime, { 
    includeTime: !!exitTime, 
    timezone: tz 
  })
  
  // Calculate duration
  let durationDisplay = ''
  if (entryTime && exitTime && closeDate) {
    try {
      const entryMs = new Date(`${openDate}T${entryTime}`).getTime()
      const exitMs = new Date(`${closeDate}T${exitTime}`).getTime()
      const diffMs = exitMs - entryMs
      
      if (diffMs > 0) {
        const minutes = Math.floor(diffMs / (1000 * 60))
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        
        if (days > 0) {
          durationDisplay = `${days}d ${hours % 24}h ${minutes % 60}m`
        } else if (hours > 0) {
          durationDisplay = `${hours}h ${minutes % 60}m`
        } else {
          durationDisplay = `${minutes}m`
        }
      }
    } catch (error) {
      console.warn('Failed to calculate duration:', error)
    }
  }
  
  return {
    entryDisplay,
    exitDisplay,
    durationDisplay
  }
}

/**
 * Format relative date (e.g., "2 days ago", "Today")
 */
function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays === -1) return 'Tomorrow'
  if (diffDays > 0 && diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 0 && diffDays > -7) return `In ${Math.abs(diffDays)} days`
  
  return date.toLocaleDateString()
}

/**
 * Get user's display timezone preference from localStorage
 */
export function getDisplayTimezone(): number {
  if (typeof window === 'undefined') return getCurrentTimezone().value
  
  try {
    const stored = localStorage.getItem('display:timezoneOffsetMinutes')
    if (stored) {
      return parseInt(stored, 10)
    }
  } catch (error) {
    console.warn('Failed to get display timezone from localStorage:', error)
  }
  
  return getCurrentTimezone().value
}

/**
 * Set user's display timezone preference
 */
export function setDisplayTimezone(offsetMinutes: number): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('display:timezoneOffsetMinutes', String(offsetMinutes))
  } catch (error) {
    console.warn('Failed to set display timezone in localStorage:', error)
  }
}
