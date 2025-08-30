/**
 * Comprehensive timezone utilities for CSV import
 */

export interface TimezoneOption {
  label: string
  value: number // offset in minutes from UTC
  region: string
  cities: string[]
}

export const TIMEZONE_REGIONS = {
  'North America': [
    { label: 'Eastern Time (ET)', value: -300, region: 'North America', cities: ['New York', 'Miami', 'Toronto'] },
    { label: 'Central Time (CT)', value: -360, region: 'North America', cities: ['Chicago', 'Dallas', 'Mexico City'] },
    { label: 'Mountain Time (MT)', value: -420, region: 'North America', cities: ['Denver', 'Phoenix', 'Salt Lake City'] },
    { label: 'Pacific Time (PT)', value: -480, region: 'North America', cities: ['Los Angeles', 'San Francisco', 'Seattle'] },
    { label: 'Alaska Time (AKST)', value: -540, region: 'North America', cities: ['Anchorage', 'Juneau'] },
    { label: 'Hawaii Time (HST)', value: -600, region: 'North America', cities: ['Honolulu'] },
    { label: 'Atlantic Time (AST)', value: -240, region: 'North America', cities: ['Halifax', 'Bermuda'] },
    { label: 'Newfoundland Time (NST)', value: -210, region: 'North America', cities: ['St. John\'s'] }
  ],
  'Europe': [
    { label: 'Greenwich Mean Time (GMT)', value: 0, region: 'Europe', cities: ['London', 'Dublin', 'Lisbon'] },
    { label: 'Central European Time (CET)', value: 60, region: 'Europe', cities: ['Berlin', 'Paris', 'Rome'] },
    { label: 'Eastern European Time (EET)', value: 120, region: 'Europe', cities: ['Helsinki', 'Athens', 'Cairo'] },
    { label: 'Moscow Time (MSK)', value: 180, region: 'Europe', cities: ['Moscow', 'Minsk'] },
    { label: 'Turkey Time (TRT)', value: 180, region: 'Europe', cities: ['Istanbul', 'Ankara'] }
  ],
  'Asia': [
    { label: 'India Standard Time (IST)', value: 330, region: 'Asia', cities: ['Mumbai', 'Delhi', 'Bangalore'] },
    { label: 'China Standard Time (CST)', value: 480, region: 'Asia', cities: ['Beijing', 'Shanghai', 'Hong Kong'] },
    { label: 'Japan Standard Time (JST)', value: 540, region: 'Asia', cities: ['Tokyo', 'Osaka'] },
    { label: 'Korea Standard Time (KST)', value: 540, region: 'Asia', cities: ['Seoul'] },
    { label: 'Singapore Standard Time (SGT)', value: 480, region: 'Asia', cities: ['Singapore'] },
    { label: 'Thai Standard Time (ICT)', value: 420, region: 'Asia', cities: ['Bangkok'] },
    { label: 'Indonesia Western Time (WIB)', value: 420, region: 'Asia', cities: ['Jakarta'] },
    { label: 'Philippines Time (PHT)', value: 480, region: 'Asia', cities: ['Manila'] },
    { label: 'Malaysia Time (MYT)', value: 480, region: 'Asia', cities: ['Kuala Lumpur'] },
    { label: 'Arabian Standard Time (AST)', value: 240, region: 'Asia', cities: ['Dubai', 'Riyadh'] },
    { label: 'Iran Standard Time (IRST)', value: 210, region: 'Asia', cities: ['Tehran'] },
    { label: 'Pakistan Standard Time (PKT)', value: 300, region: 'Asia', cities: ['Karachi', 'Islamabad'] },
    { label: 'Bangladesh Standard Time (BST)', value: 360, region: 'Asia', cities: ['Dhaka'] },
    { label: 'Nepal Time (NPT)', value: 345, region: 'Asia', cities: ['Kathmandu'] },
    { label: 'Sri Lanka Time (SLST)', value: 330, region: 'Asia', cities: ['Colombo'] },
    { label: 'Maldives Time (MVT)', value: 300, region: 'Asia', cities: ['Male'] }
  ],
  'Australia & Pacific': [
    { label: 'Australian Eastern Time (AEST)', value: 600, region: 'Australia & Pacific', cities: ['Sydney', 'Melbourne', 'Brisbane'] },
    { label: 'Australian Central Time (ACST)', value: 570, region: 'Australia & Pacific', cities: ['Adelaide', 'Darwin'] },
    { label: 'Australian Western Time (AWST)', value: 480, region: 'Australia & Pacific', cities: ['Perth'] },
    { label: 'New Zealand Time (NZST)', value: 720, region: 'Australia & Pacific', cities: ['Auckland', 'Wellington'] },
    { label: 'Fiji Time (FJT)', value: 720, region: 'Australia & Pacific', cities: ['Suva'] }
  ],
  'Africa': [
    { label: 'West Africa Time (WAT)', value: 60, region: 'Africa', cities: ['Lagos', 'Accra'] },
    { label: 'Central Africa Time (CAT)', value: 120, region: 'Africa', cities: ['Cairo', 'Johannesburg'] },
    { label: 'East Africa Time (EAT)', value: 180, region: 'Africa', cities: ['Nairobi', 'Addis Ababa'] },
    { label: 'South Africa Time (SAST)', value: 120, region: 'Africa', cities: ['Cape Town', 'Pretoria'] }
  ],
  'South America': [
    { label: 'Brazil Time (BRT)', value: -180, region: 'South America', cities: ['São Paulo', 'Rio de Janeiro'] },
    { label: 'Argentina Time (ART)', value: -180, region: 'South America', cities: ['Buenos Aires'] },
    { label: 'Colombia Time (COT)', value: -300, region: 'South America', cities: ['Bogotá'] },
    { label: 'Peru Time (PET)', value: -300, region: 'South America', cities: ['Lima'] },
    { label: 'Chile Time (CLT)', value: -240, region: 'South America', cities: ['Santiago'] },
    { label: 'Venezuela Time (VET)', value: -240, region: 'South America', cities: ['Caracas'] }
  ]
}

export const ALL_TIMEZONES: TimezoneOption[] = Object.values(TIMEZONE_REGIONS).flat()

/**
 * Get user's current timezone automatically
 */
export function getCurrentTimezone(): TimezoneOption {
  const offsetMinutes = -new Date().getTimezoneOffset()
  const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  // Try to find exact match
  const exactMatch = ALL_TIMEZONES.find(tz => tz.value === offsetMinutes)
  if (exactMatch) return exactMatch
  
  // Create a custom entry for the user's timezone
  return {
    label: `Local Time (${timezoneName})`,
    value: offsetMinutes,
    region: 'Local',
    cities: [timezoneName]
  }
}

/**
 * Format timezone for display
 */
export function formatTimezoneOffset(offsetMinutes: number): string {
  const hours = Math.floor(Math.abs(offsetMinutes) / 60)
  const minutes = Math.abs(offsetMinutes) % 60
  const sign = offsetMinutes >= 0 ? '+' : '-'
  
  if (minutes === 0) {
    return `(UTC${sign}${hours.toString().padStart(2, '0')}:00)`
  } else {
    return `(UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')})`
  }
}

/**
 * Convert datetime string from source timezone to UTC
 * @param datetimeString - Date/time string in source timezone (e.g., "2025-08-30 19:34:00" or "2025-08-30")
 * @param sourceTimezoneOffsetMinutes - Source timezone offset in minutes from UTC (e.g., 330 for IST)
 * @returns ISO string in UTC (e.g., "2025-08-30T14:04:00.000Z")
 */
export function convertToUTC(datetimeString: string, sourceTimezoneOffsetMinutes: number): string {
  if (!datetimeString) return new Date().toISOString()
  
  const trimmed = datetimeString.trim()
  
  // Parse date and time components
  let dateStr = ''
  let timeStr = '00:00:00'
  
  if (trimmed.includes(' ')) {
    [dateStr, timeStr] = trimmed.split(' ')
  } else if (trimmed.includes('T')) {
    [dateStr, timeStr] = trimmed.split('T')
  } else {
    dateStr = trimmed
  }
  
  // Normalize date format to YYYY-MM-DD
  let normalizedDate = dateStr
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      // Assume MM/DD/YYYY format by default
      const [month, day, year] = parts
      normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-')
    if (parts.length === 3 && parts[0].length === 4) {
      // Already YYYY-MM-DD
      normalizedDate = dateStr
    }
  }
  
  // Ensure time has seconds
  if (timeStr && !timeStr.includes(':')) {
    timeStr = '00:00:00'
  } else if (timeStr && timeStr.split(':').length === 2) {
    timeStr += ':00'
  }
  
  // Create date object assuming the datetime is in the source timezone
  const localDateTime = new Date(`${normalizedDate}T${timeStr}`)
  
  // Convert to UTC by subtracting the source timezone offset
  const utcTime = new Date(localDateTime.getTime() - (sourceTimezoneOffsetMinutes * 60 * 1000))
  
  return utcTime.toISOString()
}

/**
 * Convert UTC datetime to user's local timezone for display
 * @param utcDatetimeString - UTC datetime string (e.g., "2025-08-30T14:04:00.000Z")
 * @param targetTimezoneOffsetMinutes - Target timezone offset in minutes from UTC
 * @returns Formatted datetime string in target timezone
 */
export function convertFromUTC(utcDatetimeString: string, targetTimezoneOffsetMinutes: number): string {
  if (!utcDatetimeString) return ''
  
  const utcDate = new Date(utcDatetimeString)
  if (isNaN(utcDate.getTime())) return utcDatetimeString
  
  // Convert to target timezone
  const targetTime = new Date(utcDate.getTime() + (targetTimezoneOffsetMinutes * 60 * 1000))
  
  // Format as YYYY-MM-DD HH:mm:ss
  const year = targetTime.getUTCFullYear()
  const month = String(targetTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(targetTime.getUTCDate()).padStart(2, '0')
  const hours = String(targetTime.getUTCHours()).padStart(2, '0')
  const minutes = String(targetTime.getUTCMinutes()).padStart(2, '0')
  const seconds = String(targetTime.getUTCSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Get broker-specific timezone defaults
 */
export function getBrokerTimezoneDefault(brokerId: string): number {
  const defaults: Record<string, number> = {
    'tradovate': 330, // IST (UTC+5:30) - common for Indian users
    'ninjatrader': -360, // CST (UTC-6) - Chicago time
    'interactivebrokers': 0, // UTC - IBKR supports UTC export
    'thinkorswim': -300, // EST (UTC-5) - Eastern time
    'webull': -300, // EST (UTC-5)
    'charles_schwab': -300, // EST (UTC-5)
    'fidelity': -300, // EST (UTC-5)
    'generic': getCurrentTimezone().value // User's current timezone
  }
  
  return defaults[brokerId] || getCurrentTimezone().value
}

/**
 * Apply timezone offset to date string during parsing (legacy function)
 */
export function applyTimezoneToDate(dateString: string, timezoneOffsetMinutes: number): Date {
  // Parse the date string as if it's in the specified timezone
  const [year, month, day] = dateString.split(/[-/]/).map(Number)
  
  // Create date in the specified timezone
  const localDate = new Date(year, (month - 1), day)
  
  // Adjust for the timezone offset difference
  const currentOffsetMinutes = -new Date().getTimezoneOffset()
  const offsetDifference = timezoneOffsetMinutes - currentOffsetMinutes
  
  // Apply the offset difference
  localDate.setMinutes(localDate.getMinutes() + offsetDifference)
  
  return localDate
}

