import { logger } from '@/lib/logger'

import { Bar } from '@/config/instruments'

export type Provider = 'yahoo' | 'binance'

export class MarketDataService {
  // Simple in-memory day bucket cache: key = `${provider}:${normSymbol}:${ymd}:${interval}`
  private static cache = new Map<string, Bar[]>()

  static async getIntraday(
    rawSymbol: string,
    startISO: string,
    endISO: string,
    interval: '1m' | '5m' = '1m'
  ): Promise<Bar[]> {
    const providers: Provider[] = this.pickProviders(rawSymbol)
    const { normForProvider } = this

    const ymd = startISO.slice(0, 10)
    const endYmd = endISO.slice(0, 10)
    const sameDay = ymd === endYmd
    for (const provider of providers) {
      const symbol = normForProvider(provider, rawSymbol)
      const cacheKey = `${provider}:${symbol}:${ymd}:${interval}`
      if (sameDay && this.cache.has(cacheKey)) {
        // Use cached day bucket and slice to window locally
        const dayBars = this.cache.get(cacheKey)!
        return this.sliceWindow(dayBars, startISO, endISO)
      }

      try {
        const url = `/api/market-data/ohlcv?provider=${provider}&symbol=${encodeURIComponent(symbol)}&start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}&interval=${interval}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: { bars: Bar[]; dayBucket?: Bar[] } = await res.json()
        const bars = data.bars || []
        const bucket = data.dayBucket || bars
        if (sameDay) {
          this.cache.set(cacheKey, bucket)
        }
        return this.sliceWindow(bucket, startISO, endISO)
      } catch (e) {
        // Continue to next provider
        // logger.warn('Provider failed', provider, e)
      }
    }
    return []
  }

  private static sliceWindow(bars: Bar[], startISO: string, endISO: string): Bar[] {
    const start = new Date(startISO).getTime()
    const end = new Date(endISO).getTime()
    return bars.filter(b => {
      const t = new Date(b.time).getTime()
      return t >= start && t <= end
    })
  }

  private static pickProviders(rawSymbol: string): Provider[] {
    const s = rawSymbol.toUpperCase()
    // Simple heuristic: if ends with USDT/USDC/BTC/ETH -> crypto
    if (/[A-Z]{2,10}(USDT|USDC|BTC|ETH)$/.test(s)) return ['binance', 'yahoo']
    // If contains ':' prefixing exchange like CME_MINI: -> likely futures; try Yahoo
    if (s.includes(':')) return ['yahoo', 'binance']
    // Default: try Yahoo then Binance
    return ['yahoo', 'binance']
  }

  static normForProvider(provider: Provider, rawSymbol: string): string {
    const s = rawSymbol.trim().toUpperCase()
    // Strip known prefixes like CME_MINI:, BINANCE:
    const stripped = s.includes(':') ? s.split(':').pop()! : s

    if (provider === 'binance') {
      // Expect symbols like BTCUSDT, ETHUSDT, SOLUSDT
      return stripped.replace(/[^A-Z]/g, '')
    }

    // Yahoo cases
    // Map common futures roots to Yahoo continuous
    if (['ES', 'MES'].includes(stripped) || /^ES\w{0,4}$/.test(stripped)) return 'ES=F'
    if (['NQ', 'MNQ'].includes(stripped) || /^NQ\w{0,4}$/.test(stripped)) return 'NQ=F'
    if (['YM', 'MYM'].includes(stripped) || /^YM\w{0,4}$/.test(stripped)) return 'YM=F'
    if (stripped === 'CL' || /^CL\w{0,4}$/.test(stripped)) return 'CL=F'
    if (['GC', 'MGC'].includes(stripped) || /^GC\w{0,4}$/.test(stripped)) return 'GC=F'
    if (['SI', 'MSI'].includes(stripped) || /^SI\w{0,4}$/.test(stripped)) return 'SI=F'
    if (['RTY', 'M2K'].includes(stripped) || /^RTY\w{0,4}$/.test(stripped)) return 'RTY=F'

    // Forex pairs: EURUSD -> EURUSD=X
    if (/^[A-Z]{6}$/.test(stripped)) return `${stripped}=X`

    // Indices aliases
    if (stripped === 'SPX' || stripped === 'SP500' || stripped === 'S&P500') return '^GSPC'
    if (stripped === 'NDX') return '^NDX'

    return stripped
  }
}
