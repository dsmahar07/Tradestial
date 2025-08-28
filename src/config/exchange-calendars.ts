// Basic US exchange holiday and half-day calendar helpers
// NOTE: This is a pragmatic subset. Extend as needed.

export type SessionKind = 'cme_futures' | 'equity_regular' | 'twenty_four_hour'

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay()
  return day === 0 || day === 6
}

// Compute common US holidays (observed) in exchange-local calendar
// We pass a date representing the local session day (constructed in exchange local components)
function isNYSEHoliday(local: Date): boolean {
  const y = local.getUTCFullYear()
  const m = local.getUTCMonth() + 1
  const d = local.getUTCDate()
  const dow = local.getUTCDay()

  // Helper to find nth weekday of month
  const nthDow = (year: number, month: number, dow: number, n: number) => {
    const first = new Date(Date.UTC(year, month - 1, 1))
    const firstDow = first.getUTCDay()
    let day = 1 + ((7 + dow - firstDow) % 7) + (n - 1) * 7
    return new Date(Date.UTC(year, month - 1, day))
  }
  // Helper to find last weekday of month
  const lastDow = (year: number, month: number, dow: number) => {
    const last = new Date(Date.UTC(year, month, 0)) // last day of month
    const lastDowVal = last.getUTCDay()
    const diff = (7 + lastDowVal - dow) % 7
    const day = last.getUTCDate() - diff
    return new Date(Date.UTC(year, month - 1, day))
  }

  // Fixed-date observed (Mon if Sunday, Fri if Saturday)
  const observed = (month: number, day: number) => {
    const dt = new Date(Date.UTC(y, month - 1, day))
    const wd = dt.getUTCDay()
    if (wd === 0) return new Date(Date.UTC(y, month - 1, day + 1))
    if (wd === 6) return new Date(Date.UTC(y, month - 1, day - 1))
    return dt
  }

  const newYears = observed(1, 1)
  const mlk = nthDow(y, 1, 1, 3) // 3rd Mon Jan
  const presidents = nthDow(y, 2, 1, 3) // 3rd Mon Feb
  const memorial = lastDow(y, 5, 1) // last Mon May
  const juneteenth = observed(6, 19)
  const independence = observed(7, 4)
  const labor = nthDow(y, 9, 1, 1) // 1st Mon Sep
  // Thanksgiving: 4th Thu Nov
  const thanksgiving = nthDow(y, 11, 4, 4)
  const christmas = observed(12, 25)

  const sameDay = (a: Date) => a.getUTCFullYear() === y && (a.getUTCMonth() + 1) === m && a.getUTCDate() === d

  if (sameDay(newYears)) return true
  if (sameDay(mlk)) return true
  if (sameDay(presidents)) return true
  if (sameDay(memorial)) return true
  if (sameDay(juneteenth)) return true
  if (sameDay(independence)) return true
  if (sameDay(labor)) return true
  if (sameDay(thanksgiving)) return true
  if (sameDay(christmas)) return true

  return false
}

function isNYSEHalfDay(local: Date): boolean {
  // Typical half-days: day after Thanksgiving, sometimes Christmas Eve
  const y = local.getUTCFullYear()
  const m = local.getUTCMonth() + 1
  const d = local.getUTCDate()
  const dow = local.getUTCDay()

  // Day after Thanksgiving (Fri): 4th Thu Nov + 1 day
  const nthDow = (year: number, month: number, dow: number, n: number) => {
    const first = new Date(Date.UTC(year, month - 1, 1))
    const firstDow = first.getUTCDay()
    let day = 1 + ((7 + dow - firstDow) % 7) + (n - 1) * 7
    return new Date(Date.UTC(year, month - 1, day))
  }
  const thanksgiving = nthDow(y, 11, 4, 4)
  const blackFriday = new Date(Date.UTC(y, 10, thanksgiving.getUTCDate() + 1))
  const isBlackFriday = (m === 11 && blackFriday.getUTCDate() === d && dow === 5)

  // Christmas Eve (Dec 24) sometimes half-day
  const isXmasEve = m === 12 && d === 24 && (dow >= 1 && dow <= 5)

  return isBlackFriday || isXmasEve
}

function isCMEHoliday(local: Date): boolean {
  // Use NYSE holiday set as approximation for full closures affecting US futures; refine if needed
  return isNYSEHoliday(local)
}

function isCMEHalfDay(local: Date): boolean {
  // Approximate common half-days: Christmas Eve and day after Thanksgiving
  return isNYSEHalfDay(local)
}

// Return a local close time tuple [H, M] for the given session/date, considering half-days
export function getSessionCloseLocalHM(session: SessionKind, localSessionDate: Date): [number, number] {
  if (session === 'equity_regular') {
    if (isNYSEHoliday(localSessionDate)) return [0, 0] // closed
    if (isNYSEHalfDay(localSessionDate)) return [13, 0] // 1:00 PM ET
    return [16, 0]
  }
  if (session === 'cme_futures') {
    if (isCMEHoliday(localSessionDate)) return [0, 0]
    if (isCMEHalfDay(localSessionDate)) return [12, 0] // 12:00 PM CT typical early close
    return [16, 0] // Regular 16:00 CT session end
  }
  // 24h: no special close (use end of day)
  return [23, 59]
}
