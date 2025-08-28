/**
 * Date utility functions to handle timezone issues
 * Prevents date shifting when parsing date strings
 */

/**
 * Safely parse a date string to Date object without timezone issues
 * @param dateString - Date string in various formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
 * @returns Date object with correct local date
 */
export function parseLocalDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString
  }
  
  if (!dateString) {
    return new Date()
  }

  // Handle YYYY-MM-DD format directly to avoid timezone shift
  const isoMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const year = parseInt(isoMatch[1])
    const month = parseInt(isoMatch[2]) - 1 // Month is 0-indexed
    const day = parseInt(isoMatch[3])
    return new Date(year, month, day)
  }

  // Handle MM/DD/YYYY format
  const usMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (usMatch) {
    const month = parseInt(usMatch[1]) - 1 // Month is 0-indexed
    const day = parseInt(usMatch[2])
    const year = parseInt(usMatch[3])
    return new Date(year, month, day)
  }

  // Handle DD/MM/YYYY format
  const euMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (euMatch) {
    const day = parseInt(euMatch[1])
    const month = parseInt(euMatch[2]) - 1 // Month is 0-indexed
    const year = parseInt(euMatch[3])
    // Assume MM/DD/YYYY unless day > 12
    if (parseInt(euMatch[1]) > 12) {
      return new Date(year, month, day)
    } else {
      return new Date(year, parseInt(euMatch[1]) - 1, parseInt(euMatch[2]))
    }
  }

  // For other formats, add noon time to avoid timezone issues
  const fallbackDate = new Date(dateString + ' 12:00:00')
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate
  }

  // Final fallback
  return new Date()
}

/**
 * Get the day of week avoiding timezone issues
 * @param dateString - Date string
 * @returns Day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateString: string | Date): number {
  return parseLocalDate(dateString).getDay()
}

/**
 * Get month index avoiding timezone issues
 * @param dateString - Date string  
 * @returns Month index (0 = January, 11 = December)
 */
export function getMonth(dateString: string | Date): number {
  return parseLocalDate(dateString).getMonth()
}

/**
 * Get year avoiding timezone issues
 * @param dateString - Date string
 * @returns Full year
 */
export function getYear(dateString: string | Date): number {
  return parseLocalDate(dateString).getFullYear()
}