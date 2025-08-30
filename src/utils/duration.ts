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
    console.debug('📊 Duration calc: No openDate provided')
    return null
  }

  console.debug('📊 Duration calc inputs:', { entryTime, exitTime, openDate, closeDate })

  // If we have both entry and exit times, use precise calculation
  if (entryTime && exitTime && entryTime.trim() !== '' && exitTime.trim() !== '') {
    console.debug('📊 Duration calc: Using precise calculation with entry/exit times')
    const result = calculatePreciseDuration(entryTime, exitTime, openDate, closeDate)
    if (result) return validateDurationResult(result)
  }

  // Fallback: if openDate or closeDate contain timestamps, extract them
  if (openDate.includes(' ') || closeDate?.includes(' ')) {
    console.debug('📊 Duration calc: Using timestamp extraction')
    const result = calculateDurationFromTimestamps(openDate, closeDate)
    if (result) return validateDurationResult(result)
  }

  // Enhanced fallback: Try parsing dates even if they don't contain spaces
  if (closeDate) {
    console.debug('📊 Duration calc: Attempting date parsing fallback')
    const result = calculateEnhancedDateDuration(openDate, closeDate)
    if (result) return validateDurationResult(result)
  }

  // If it's a same-day trade without time info, return a reasonable estimate
  if (!closeDate || openDate === closeDate) {
    console.debug('📊 Duration calc: Same-day trade, using default duration')
    return {
      hours: 0,
      minutes: 30, // More reasonable default than 1 minute
      totalMinutes: 30,
      formatted: '~30m'
    }
  }

  // Final fallback: if we have different dates but can't parse them properly
  console.debug('📊 Duration calc: Using final fallback')
  return {
    hours: 2,
    minutes: 0,
    totalMinutes: 120,
    formatted: '~2h'
  }
}

/**
 * Validate and potentially adjust duration result to ensure it's reasonable
 */
function validateDurationResult(result: TradeDuration | null): TradeDuration | null {
  if (!result) return null
  
  // Do not aggressively cap genuine long durations. Only sanity-check extremely large values elsewhere.
  
  return result
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
    console.debug('📊 Precise duration calc:', { entryTime, exitTime, openDate, closeDate })
    
    let entry: Date, exit: Date
    
    // Check if entryTime and exitTime are full timestamps (contain space/date)
    if (entryTime.includes(' ') || entryTime.includes('/')) {
      // Full timestamps - parse directly with conversion for MM/DD/YYYY format
      entry = new Date(convertTimestampFormat(entryTime))
      exit = new Date(convertTimestampFormat(exitTime))
      console.debug('📊 Parsed full timestamps:', { entry: entry.toISOString(), exit: exit.toISOString() })
    } else {
      // Time-only components - combine with dates
      const entryDateStr = openDate.includes('T') ? openDate.split('T')[0] : openDate
      const exitDateStr = closeDate ? (closeDate.includes('T') ? closeDate.split('T')[0] : closeDate) : entryDateStr
      
      // Handle various time formats
      const normalizedEntryTime = normalizeTimeFormat(entryTime)
      const normalizedExitTime = normalizeTimeFormat(exitTime)
      
      entry = new Date(`${entryDateStr} ${normalizedEntryTime}`)
      exit = new Date(`${exitDateStr} ${normalizedExitTime}`)
      console.debug('📊 Parsed combined date/time:', { entry: entry.toISOString(), exit: exit.toISOString() })
    }
    
    // Validate date parsing
    if (isNaN(entry.getTime()) || isNaN(exit.getTime())) {
      console.debug('📊 Invalid date parsing in calculatePreciseDuration:', { entryTime, exitTime, entry: entry.toString(), exit: exit.toString() })
      return null
    }
    
    let diffMs = exit.getTime() - entry.getTime()
    
    // Handle negative durations (might be next day trades)
    if (diffMs < 0) {
      console.debug('📊 Negative duration detected, checking if next day trade')
      // Try adding a day to the exit time
      const nextDayExit = new Date(exit.getTime() + 24 * 60 * 60 * 1000)
      const nextDayDiffMs = nextDayExit.getTime() - entry.getTime()
      
      if (nextDayDiffMs > 0 && nextDayDiffMs < 48 * 60 * 60 * 1000) { // Within 48 hours
        diffMs = nextDayDiffMs
        console.debug('📊 Adjusted for next-day trade:', { nextDayDiffMs })
      } else {
        console.debug('📊 Still negative duration after adjustment')
        return null
      }
    }
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    console.debug('📊 Calculated duration:', { totalMinutes, hours, minutes })
    
    // Validate duration for day trading scenarios — log but do not override
    if (totalMinutes > 12 * 60) { // More than 12 hours
      console.debug('📊 Duration seems long for typical day trade (no override applied):', {
        totalMinutes,
        hours,
        entry: entry.toISOString(),
        exit: exit.toISOString()
      })
    }
    
    return {
      hours,
      minutes,
      totalMinutes,
      formatted: formatDuration(totalMinutes)
    }
  } catch (error) {
    console.debug('📊 Error in calculatePreciseDuration:', error)
    return null
  }
}

/**
 * Normalize time format to HH:MM:SS
 */
function normalizeTimeFormat(timeStr: string): string {
  if (!timeStr) return '00:00:00'
  
  // Remove any extra spaces
  const cleanTime = timeStr.trim()
  
  // If already in HH:MM:SS format
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(cleanTime)) {
    return cleanTime
  }
  
  // If in HH:MM format, add seconds
  if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
    return `${cleanTime}:00`
  }
  
  // If just hours
  if (/^\d{1,2}$/.test(cleanTime)) {
    return `${cleanTime}:00:00`
  }
  
  // Default fallback
  return '00:00:00'
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
    console.debug('📊 Timestamp duration calc:', { openDate, closeDate })
    
    // Use enhanced parsing
    const entry = tryParseDate(openDate)
    const exit = closeDate ? tryParseDate(closeDate) : entry
    
    if (!entry || !exit) {
      console.debug('📊 Could not parse timestamp dates')
      return null
    }
    
    let diffMs = exit.getTime() - entry.getTime()
    
    // Handle same date case (intraday)
    if (diffMs === 0) {
      console.debug('📊 Same timestamp detected, using default intraday duration')
      return {
        hours: 1,
        minutes: 30,
        totalMinutes: 90,
        formatted: '1h 30m'
      }
    }
    
    // Handle negative duration
    if (diffMs < 0) {
      console.debug('📊 Negative duration in timestamps, taking absolute value')
      diffMs = Math.abs(diffMs)
    }
    
    // Validate duration
    if (diffMs > 7 * 24 * 60 * 60 * 1000) {
      console.debug('📊 Duration from timestamps too large')
      return null
    }
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    console.debug('📊 Calculated duration from timestamps:', { totalMinutes, hours, minutes })
    
    return {
      hours,
      minutes,
      totalMinutes,
      formatted: formatDuration(totalMinutes)
    }
  } catch (error) {
    console.debug('📊 Error in timestamp duration calc:', error)
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

/**
 * Enhanced date duration calculation with better parsing
 * Handles various date formats and provides sensible defaults
 */
function calculateEnhancedDateDuration(openDate: string, closeDate: string): TradeDuration | null {
  try {
    console.debug('📊 Enhanced date calc:', { openDate, closeDate })
    
    // Try multiple date parsing approaches
    let openParsed: Date | null = null
    let closeParsed: Date | null = null
    
    // Approach 1: Direct parsing
    openParsed = tryParseDate(openDate)
    closeParsed = tryParseDate(closeDate)
    
    if (!openParsed || !closeParsed) {
      console.debug('📊 Enhanced date calc: Could not parse dates')
      return null
    }
    
    const diffMs = closeParsed.getTime() - openParsed.getTime()
    
    // Validate duration (must be positive and reasonable)
    if (diffMs < 0) {
      console.debug('📊 Enhanced date calc: Negative duration, swapping dates')
      const temp = openParsed
      openParsed = closeParsed
      closeParsed = temp
    }
    
    const totalMinutes = Math.abs(diffMs) / (1000 * 60)
    
    console.debug('📊 Enhanced date calc - calculated duration:', {
      diffMs,
      totalMinutes,
      hours: Math.floor(totalMinutes / 60),
      openParsed: openParsed.toISOString(),
      closeParsed: closeParsed.toISOString()
    })
    
    // If duration is unreasonably large (>12 hours for most day trades), investigate
    if (totalMinutes > 12 * 60) {
      console.debug('📊 Enhanced date calc: Duration seems too large for typical day trade')
      
      // Check if this might be a same-day trade with date parsing issues
      const openDateOnly = openParsed.toDateString()
      const closeDateOnly = closeParsed.toDateString()
      
      if (openDateOnly === closeDateOnly) {
        console.debug('📊 Same day detected but large duration - likely parsing error, using intraday estimate')
        return {
          hours: 2,
          minutes: 15,
          totalMinutes: 135,
          formatted: '2h 15m'
        }
      }
      
      // Multi-day trade - but cap at reasonable swing trade duration
      if (totalMinutes > 30 * 24 * 60) { // More than 30 days
        console.debug('📊 Duration too large (>30 days), using default')
        return {
          hours: 2,
          minutes: 0,
          totalMinutes: 120,
          formatted: '~2h'
        }
      }
    }
    
    // If duration is very small (same day), provide a reasonable minimum
    if (totalMinutes < 1) {
      return {
        hours: 0,
        minutes: 15,
        totalMinutes: 15,
        formatted: '~15m'
      }
    }
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)
    
    return {
      hours,
      minutes,
      totalMinutes: Math.floor(totalMinutes),
      formatted: formatDuration(Math.floor(totalMinutes))
    }
  } catch (error) {
    console.debug('📊 Enhanced date calc error:', error)
    return null
  }
}

/**
 * Try to parse a date string using multiple approaches
 */
function tryParseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null
  
  const approaches = [
    // Direct parsing
    () => new Date(dateStr),
    // ISO format parsing
    () => new Date(dateStr.replace(/-/g, '/')),
    // MM/DD/YYYY format
    () => {
      const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
      if (match) {
        const [, month, day, year] = match
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
      }
      return null
    },
    // YYYY-MM-DD format
    () => {
      const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
      if (match) {
        const [, year, month, day] = match
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
      }
      return null
    }
  ]
  
  for (const approach of approaches) {
    try {
      const date = approach()
      if (date && !isNaN(date.getTime())) {
        return date
      }
    } catch {
      continue
    }
  }
  
  return null
}