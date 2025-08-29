/**
 * Duration calculation utilities for trade analysis
 */

export interface TradeDuration {
  hours: number
  minutes: number  
  totalMinutes: number
  formatted: string
}

/**
 * Calculate the duration between trade entry and exit
 * Handles multi-day trades correctly by using both date and time components
 * Falls back to date-only calculation if times are not available
 */
export function calculateTradeDuration(
  entryTime?: string,
  exitTime?: string, 
  openDate?: string,
  closeDate?: string
): TradeDuration | null {
  if (!openDate) {
    return null
  }

  // If we have both entry and exit times, use precise calculation
  if (entryTime && exitTime) {
    return calculatePreciseDuration(entryTime, exitTime, openDate, closeDate)
  }

  // Fallback: if openDate or closeDate contain timestamps, extract them
  if (openDate.includes(' ') || closeDate?.includes(' ')) {
    return calculateDurationFromTimestamps(openDate, closeDate)
  }

  // Last resort: date-only calculation (less precise but better than N/A)
  if (closeDate && openDate !== closeDate) {
    const durationMinutes = calculateDateOnlyDuration(openDate, closeDate)
    if (durationMinutes !== null) {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = Math.floor(durationMinutes % 60)
      return {
        hours,
        minutes,
        totalMinutes: Math.floor(durationMinutes),
        formatted: formatDuration(Math.floor(durationMinutes))
      }
    }
  }

  // If it's a same-day trade without time info, return a minimal duration
  if (!closeDate || openDate === closeDate) {
    return {
      hours: 0,
      minutes: 1,
      totalMinutes: 1,
      formatted: '~1m'
    }
  }

  return null
}

/**
 * Calculate precise duration with both date and time components
 */
function calculatePreciseDuration(
  entryTime: string,
  exitTime: string,
  openDate: string,
  closeDate?: string
): TradeDuration | null {
  try {
    let entry: Date, exit: Date
    
    // Check if entryTime and exitTime are full timestamps (contain space/date)
    if (entryTime.includes(' ') || entryTime.includes('/')) {
      // Full timestamps - parse directly with conversion for MM/DD/YYYY format
      entry = new Date(convertTimestampFormat(entryTime))
      exit = new Date(convertTimestampFormat(exitTime))
    } else {
      // Time-only components - combine with dates
      const entryDateStr = openDate.split('T')[0]
      const exitDateStr = closeDate ? closeDate.split('T')[0] : entryDateStr
      
      entry = new Date(`${entryDateStr} ${entryTime}`)
      exit = new Date(`${exitDateStr} ${exitTime}`)
    }
    
    // Validate date parsing
    if (isNaN(entry.getTime()) || isNaN(exit.getTime())) {
      console.warn('Invalid date parsing in calculatePreciseDuration:', { entryTime, exitTime })
      return null
    }
    
    const diffMs = exit.getTime() - entry.getTime()
    
    // Validate duration (negative or unreasonably large durations are invalid)
    if (diffMs < 0 || diffMs > 7 * 24 * 60 * 60 * 1000) { // Max 7 days
      console.warn('Invalid duration in calculatePreciseDuration:', { diffMs, entry: entry.toISOString(), exit: exit.toISOString() })
      return null
    }
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return {
      hours,
      minutes,
      totalMinutes,
      formatted: formatDuration(totalMinutes)
    }
  } catch (error) {
    console.warn('Error in calculatePreciseDuration:', error)
    return null
  }
}

/**
 * Convert MM/DD/YYYY HH:mm:ss to YYYY-MM-DD HH:mm:ss format that JavaScript can parse reliably
 */
function convertTimestampFormat(timestamp: string): string {
  if (!timestamp) return timestamp
  
  // MM/DD/YYYY HH:mm:ss -> YYYY-MM-DD HH:mm:ss
  const match = timestamp.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(.+)$/)
  if (match) {
    const [, month, day, year, time] = match
    return `${year}-${month}-${day} ${time}`
  }
  return timestamp
}

/**
 * Calculate duration when timestamps are embedded in date strings
 */
function calculateDurationFromTimestamps(openDate: string, closeDate?: string): TradeDuration | null {
  try {
    const entry = new Date(openDate)
    const exit = closeDate ? new Date(closeDate) : entry
    
    const diffMs = exit.getTime() - entry.getTime()
    
    // Validate duration
    if (diffMs < 0 || diffMs > 7 * 24 * 60 * 60 * 1000) {
      return null
    }
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return {
      hours,
      minutes,
      totalMinutes,
      formatted: formatDuration(totalMinutes)
    }
  } catch {
    return null
  }
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 1) return '<1m'
  
  // For durations over 24 hours, show days
  if (totalMinutes >= 24 * 60) {
    const days = Math.floor(totalMinutes / (24 * 60))
    const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const remainingMins = totalMinutes % 60
    
    if (days > 0 && remainingHours > 0) {
      return `${days}d ${remainingHours}h`
    } else if (days > 0) {
      return `${days}d`
    }
  }
  
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

/**
 * Calculate duration using only date components (without time)
 * Useful for broader metrics where exact time precision isn't required
 */
export function calculateDateOnlyDuration(openDate: string, closeDate: string): number | null {
  try {
    const open = new Date(openDate)
    const close = new Date(closeDate)
    const diffMs = close.getTime() - open.getTime()
    
    if (!isFinite(diffMs) || diffMs < 0) return null
    
    return diffMs / 60000 // Return minutes
  } catch {
    return null
  }
}