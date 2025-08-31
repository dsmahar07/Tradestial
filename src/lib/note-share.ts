export type SharedNote = {
  id?: string
  title: string
  content: string
  tags?: string[]
  color?: string
  createdAt?: string
  updatedAt?: string
  sharedBy?: {
    name?: string
    initials?: string
  }
  // Optional structured trading data for analytics header on shared page
  tradingData?: {
    netPnl?: number
    isProfit?: boolean
    stats?: {
      totalTrades?: number
      winners?: number
      losers?: number
      winrate?: string
      grossPnl?: number
      volume?: number
      commissions?: number
      profitFactor?: number
    }
    chartData?: Array<{ time: string; value: number }>
    trades?: any[]
    date?: string
  }
}

// Helper for unicode-safe base64
function toBase64(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64')
  }
  return btoa(unescape(encodeURIComponent(str)))
}

function fromBase64(b64: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf-8')
  }
  return decodeURIComponent(escape(atob(b64)))
}

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromUrlSafe(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return s.replace(/-/g, '+').replace(/_/g, '/') + pad
}

export function encodeNoteToToken(note: SharedNote): string {
  const payload = JSON.stringify({
    v: 2,
    n: {
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      color: note.color,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      sharedBy: note.sharedBy ? { name: note.sharedBy.name, initials: note.sharedBy.initials } : undefined,
      // trading data (optional)
      td: note.tradingData ? {
        netPnl: note.tradingData.netPnl,
        isProfit: note.tradingData.isProfit,
        stats: note.tradingData.stats,
        chartData: note.tradingData.chartData,
        trades: note.tradingData.trades,
        date: note.tradingData.date,
      } : undefined,
    },
  })
  const b64 = toBase64(payload)
  return toUrlSafe(b64)
}

export function decodeNoteToken(token: string): SharedNote | null {
  try {
    const b64 = fromUrlSafe(token)
    const json = fromBase64(b64)
    const parsed = JSON.parse(json)
    if (!parsed || !parsed.n) return null
    const n = parsed.n
    const base: SharedNote = {
      title: String(n.title || ''),
      content: String(n.content || ''),
      tags: Array.isArray(n.tags) ? n.tags.map(String) : [],
      color: typeof n.color === 'string' ? n.color : undefined,
      createdAt: typeof n.createdAt === 'string' ? n.createdAt : undefined,
      updatedAt: typeof n.updatedAt === 'string' ? n.updatedAt : undefined,
    }
    if (n.sharedBy) {
      base.sharedBy = {
        name: typeof n.sharedBy.name === 'string' ? n.sharedBy.name : undefined,
        initials: typeof n.sharedBy.initials === 'string' ? n.sharedBy.initials : undefined,
      }
    }
    // v2 trading data support (n.td)
    if (parsed.v >= 2 && n.td) {
      base.tradingData = {
        netPnl: typeof n.td.netPnl === 'number' ? n.td.netPnl : undefined,
        isProfit: typeof n.td.isProfit === 'boolean' ? n.td.isProfit : undefined,
        stats: n.td.stats,
        chartData: Array.isArray(n.td.chartData) ? n.td.chartData : undefined,
        trades: Array.isArray(n.td.trades) ? n.td.trades : undefined,
        date: typeof n.td.date === 'string' ? n.td.date : undefined,
      }
    }
    return base
  } catch (e) {
    console.error('Failed to decode note token', e)
    return null
  }
}
