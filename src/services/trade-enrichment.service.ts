import { Trade } from '@/services/trade-data.service'
import { MarketDataService } from '@/services/market-data.service'
import { Bar, getMultiplier, sideSign, getExchangeInfo } from '@/config/instruments'
import { getSessionCloseLocalHM } from '@/config/exchange-calendars'
import { DataStore } from '@/services/data-store.service'

function getSelectedTzOffsetMinutes(): number {
  // Positive = minutes east of UTC. Our import UI stores this convention.
  try {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('import:timezoneOffsetMinutes')
      if (stored != null && stored !== '') return parseInt(stored)
    }
  } catch {}
  return -new Date().getTimezoneOffset()
}

function buildUtcFromLocal(ymd: string, hms: string, offsetMinutes: number): string {
  // ymd: YYYY-MM-DD, hms: HH:mm:ss interpreted in the selected timezone
  // Convert to UTC ISO by subtracting the offset
  const [Y, M, D] = ymd.split('-').map(Number)
  const [h, m, s] = (hms || '00:00:00').split(':').map(Number)
  // Build a Date as if it were UTC for the local components
  const localLikeUtc = Date.UTC(Y, (M - 1), D, h, m, s || 0)
  const utcMs = localLikeUtc - offsetMinutes * 60 * 1000
  return new Date(utcMs).toISOString()
}

function startISOFromTradeUserTz(t: Trade): string | null {
  const date = t.openDate
  const time = t.entryTime || '09:30:00'
  if (!date) return null
  const offset = getSelectedTzOffsetMinutes()
  return buildUtcFromLocal(date, time, offset)
}

function tzOffsetMinutesAt(date: Date, timeZone: string): number {
  // Uses timeZoneName: 'shortOffset' to derive e.g., GMT-5 or UTC+1
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
  const parts = fmt.formatToParts(date)
  const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || 'UTC'
  // Parse like GMT-5, GMT+05:30, UTC+1, UTC-04:00
  const m = tzPart.match(/([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const hh = parseInt(m[2] || '0', 10)
  const mm = parseInt(m[3] || '0', 10)
  return sign * (hh * 60 + mm)
}

function buildExchangeSessionUTC(t: Trade): { startISO: string; endISO: string } | null {
  const entryUTC = startISOFromTradeUserTz(t)
  if (!entryUTC) return null
  const entryDate = new Date(entryUTC)
  const { timeZone, session } = getExchangeInfo(t.symbol)
  const offsetAtEntry = tzOffsetMinutesAt(entryDate, timeZone)

  // entry time in exchange local ms
  const entryLocalMs = entryDate.getTime() + offsetAtEntry * 60 * 1000
  const entryLocal = new Date(entryLocalMs)

  const Y = entryLocal.getUTCFullYear()
  const M = entryLocal.getUTCMonth() // 0-based
  const D = entryLocal.getUTCDate()
  const H = entryLocal.getUTCHours()
  // const Min = entryLocal.getUTCMinutes()

  function asLocalMs(y: number, m0: number, d: number, h: number, min: number, s = 0) {
    return Date.UTC(y, m0, d, h, min, s)
  }

  if (session === 'cme_futures') {
    // Session: 17:00 -> next day 16:00 (America/Chicago). Use offset at entry for both bounds.
    let startLocalMs: number
    let endLocalMs: number
    if (H >= 17) {
      startLocalMs = asLocalMs(Y, M, D, 17, 0, 0)
      // next day close (calendar aware)
      const endDate = new Date(asLocalMs(Y, M, D, 17, 0, 0))
      endDate.setUTCDate(endDate.getUTCDate() + 1)
      const [ch, cm] = getSessionCloseLocalHM('cme_futures', endDate)
      endDate.setUTCHours(ch, cm, 0, 0)
      endLocalMs = endDate.getTime()
    } else {
      // previous day 17:00 to today 16:00
      const startDate = new Date(asLocalMs(Y, M, D, 17, 0, 0))
      startDate.setUTCDate(startDate.getUTCDate() - 1)
      startLocalMs = startDate.getTime()
      const endDate = new Date(asLocalMs(Y, M, D, 16, 0, 0))
      const [ch, cm] = getSessionCloseLocalHM('cme_futures', endDate)
      endDate.setUTCHours(ch, cm, 0, 0)
      endLocalMs = endDate.getTime()
    }
    const startUTC = new Date(startLocalMs - offsetAtEntry * 60 * 1000).toISOString()
    const endUTC = new Date(endLocalMs - offsetAtEntry * 60 * 1000).toISOString()
    return { startISO: startUTC, endISO: endUTC }
  }

  if (session === 'equity_regular') {
    // 09:30 -> 16:00 in America/New_York
    const sameDayStart = asLocalMs(Y, M, D, 9, 30, 0)
    const sameDayEnd = asLocalMs(Y, M, D, 16, 0, 0)
    const startLocalMs = sameDayStart
    let endLocalMs = sameDayEnd
    // Apply holiday/half-day cap on end
    const endLocal = new Date(sameDayEnd)
    const [ch, cm] = getSessionCloseLocalHM('equity_regular', endLocal)
    endLocal.setUTCHours(ch, cm, 0, 0)
    endLocalMs = endLocal.getTime()
    // If before 09:30, use today's session; if after 16:00, still use today's session bounds (entry would be during RTH typically)
    const startUTC = new Date(startLocalMs - offsetAtEntry * 60 * 1000).toISOString()
    const endUTC = new Date(endLocalMs - offsetAtEntry * 60 * 1000).toISOString()
    return { startISO: startUTC, endISO: endUTC }
  }

  // twenty_four_hour: 00:00 -> 23:59:59 (UTC-based tz)
  const startLocalMs = asLocalMs(Y, M, D, 0, 0, 0)
  const endLocalDate = new Date(asLocalMs(Y, M, D, 23, 59, 59))
  const endLocalMs = endLocalDate.getTime()
  const startUTC = new Date(startLocalMs - offsetAtEntry * 60 * 1000).toISOString()
  const endUTC = new Date(endLocalMs - offsetAtEntry * 60 * 1000).toISOString()
  return { startISO: startUTC, endISO: endUTC }
}

function pickBestForWindow(bars: Bar[], side: 'LONG' | 'SHORT'): { price: number | null; time: string | null } {
  if (!bars.length) return { price: null, time: null }
  if (side === 'LONG') {
    let best = bars[0]
    for (const b of bars) if (b.high > best.high) best = b
    return { price: best.high, time: best.time }
  } else {
    let best = bars[0]
    for (const b of bars) if (b.low < best.low) best = b
    return { price: best.low, time: best.time }
  }
}

function computePnl(entry: number, best: number, qty: number, mult: number, side: 'LONG' | 'SHORT'): number {
  const sign = sideSign(side)
  const points = (best - entry) * sign
  return points * qty * mult
}

function computePercent(entry: number, best: number, side: 'LONG' | 'SHORT'): string {
  const sign = sideSign(side)
  const pct = ((best - entry) / entry) * 100 * sign
  return `${pct.toFixed(2)}%`
}

export class TradeEnrichmentService {
  static async enrichBestExitsForTrades(trades: Trade[]): Promise<void> {
    const patches: Partial<Trade>[] = []

    for (const t of trades) {
      try {
        if (!t.symbol || !t.entryPrice || !t.openDate) continue
        const side: 'LONG' | 'SHORT' = t.side || 'LONG'
        const qty = Math.max(1, t.contractsTraded || 1)
        const mult = getMultiplier(t.symbol)

        const exSession = buildExchangeSessionUTC(t)
        if (!exSession) continue
        const { startISO, endISO: sessionEndISO } = exSession

        // 1h and 2h windows in ms, clamped to end of the same user-local day
        const startMs = new Date(startISO).getTime()
        const oneHourISO = new Date(startMs + 60 * 60 * 1000).toISOString()
        const twoHourISO = new Date(startMs + 2 * 60 * 60 * 1000).toISOString()
        const clampTo = (iso: string, maxIso: string) => new Date(
          Math.min(new Date(iso).getTime(), new Date(maxIso).getTime())
        ).toISOString()
        const oneHourClamped = clampTo(oneHourISO, sessionEndISO)
        const twoHourClamped = clampTo(twoHourISO, sessionEndISO)

        // Fetch day bucket once via MarketDataService; it internally caches day buckets
        const dayBars = await MarketDataService.getIntraday(t.symbol, startISO, sessionEndISO, '1m')
        const inWindow = (from: string, to: string) => dayBars.filter(b => {
          const ts = new Date(b.time).getTime()
          return ts >= new Date(from).getTime() && ts <= new Date(to).getTime()
        })

        // 1h
        const bars1h = inWindow(startISO, oneHourClamped)
        const best1h = pickBestForWindow(bars1h, side)
        // 2h
        const bars2h = inWindow(startISO, twoHourClamped)
        const best2h = pickBestForWindow(bars2h, side)
        // best of day
        const bestDay = pickBestForWindow(dayBars, side)

        const patch: Partial<Trade> = { id: t.id }

        if (best1h.price != null) {
          patch.hypotheticalExit1hPrice = best1h.price
          patch.hypotheticalExit1hTime = best1h.time!
          patch.hypotheticalExit1hPnl = computePnl(t.entryPrice, best1h.price, qty, mult, side)
          patch.hypotheticalExit1hPercent = computePercent(t.entryPrice, best1h.price, side)
        }
        if (best2h.price != null) {
          patch.hypotheticalExit2hPrice = best2h.price
          patch.hypotheticalExit2hTime = best2h.time!
          patch.hypotheticalExit2hPnl = computePnl(t.entryPrice, best2h.price, qty, mult, side)
          patch.hypotheticalExit2hPercent = computePercent(t.entryPrice, best2h.price, side)
        }
        if (bestDay.price != null) {
          patch.bestExitPrice = bestDay.price
          patch.bestExitTime = bestDay.time!
          patch.bestExitPnl = computePnl(t.entryPrice, bestDay.price, qty, mult, side)
          patch.bestExitPercent = computePercent(t.entryPrice, bestDay.price, side)
        }

        patches.push(patch)
      } catch {
        // continue; leave realized fallback
      }
    }

    if (patches.length) await DataStore.upsertTrades(patches)
  }
}
