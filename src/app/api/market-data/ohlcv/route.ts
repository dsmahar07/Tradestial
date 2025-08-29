import { NextRequest, NextResponse } from 'next/server'

// Normalize Yahoo response into bars
function yahooToBars(json: any) {
  const r = json?.chart?.result?.[0]
  if (!r) return [] as any[]
  const ts = r.timestamp || []
  const o = r.indicators?.quote?.[0]?.open || []
  const h = r.indicators?.quote?.[0]?.high || []
  const l = r.indicators?.quote?.[0]?.low || []
  const c = r.indicators?.quote?.[0]?.close || []
  const v = r.indicators?.quote?.[0]?.volume || []
  const bars = [] as any[]
  for (let i = 0; i < ts.length; i++) {
    if (o[i] == null || h[i] == null || l[i] == null || c[i] == null) continue
    bars.push({
      time: new Date(ts[i] * 1000).toISOString(),
      open: Number(o[i]),
      high: Number(h[i]),
      low: Number(l[i]),
      close: Number(c[i]),
      volume: v[i] != null ? Number(v[i]) : undefined,
    })
  }
  return bars
}

// Normalize Binance klines into bars
function binanceToBars(json: any[]) {
  if (!Array.isArray(json)) return [] as any[]
  return json.map(k => ({
    time: new Date(k[0]).toISOString(), // open time ms
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const provider = (searchParams.get('provider') || 'yahoo').toLowerCase()
    const symbol = searchParams.get('symbol') || ''
    const startISO = searchParams.get('start') || ''
    const endISO = searchParams.get('end') || ''
    const interval = (searchParams.get('interval') || '1m') as '1m' | '5m'

    if (!symbol || !startISO || !endISO) {
      return NextResponse.json({ bars: [] }, { status: 200 })
    }

    if (provider === 'yahoo') {
      const startSec = Math.floor(new Date(startISO).getTime() / 1000)
      const endSec = Math.floor(new Date(endISO).getTime() / 1000)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${startSec}&period2=${endSec}&interval=${interval}&includePrePost=true&events=history`
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!r.ok) return NextResponse.json({ bars: [] }, { status: 200 })
      const j = await r.json()
      const bars = yahooToBars(j)
      return NextResponse.json({ bars })
    }

    if (provider === 'binance') {
      const startMs = new Date(startISO).getTime()
      const endMs = new Date(endISO).getTime()
      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&startTime=${startMs}&endTime=${endMs}`
      const r = await fetch(url)
      if (!r.ok) return NextResponse.json({ bars: [] }, { status: 200 })
      const j = await r.json()
      const bars = binanceToBars(j)
      return NextResponse.json({ bars })
    }

    return NextResponse.json({ bars: [] }, { status: 200 })
  } catch {
    return NextResponse.json({ bars: [] }, { status: 200 })
  }
}
